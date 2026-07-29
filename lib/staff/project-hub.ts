import { prisma } from "@/lib/db";
import { serializeInvoice } from "@/lib/billing/invoice-serialize";
import { computeProjectFinance } from "@/lib/erp/projects/finance";
import { effectiveProjectProgress, currentMilestoneLabel } from "@/lib/projects/progress";
import { serializeProjectService } from "@/lib/services/project-services";
import { serializeServiceDomain } from "@/lib/services/service-domains";
import { serializeServiceHosting } from "@/lib/services/service-hosting";
import { ensureLiveDnsSyncedIfEmpty } from "@/lib/dns/sync-domain-live";
import { getServiceTypeLabel } from "@/shared/service-types";

function readMetadata(record: unknown): Record<string, unknown> {
  if (record && typeof record === "object" && !Array.isArray(record)) {
    return record as Record<string, unknown>;
  }
  return {};
}

function centsFromMetadata(metadata: unknown, key: string): number | null {
  const meta = readMetadata(metadata);
  const value = meta[key];
  if (typeof value === "number" && value >= 0) return Math.round(value);
  return null;
}

export async function loadProjectHub(erpProjectId: string) {
  const erpProject = await prisma.erpProject.findUnique({
    where: { id: erpProjectId },
    include: {
      department: { select: { id: true, name: true } },
      customer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          company: true,
          profile: { select: { customerCode: true, phone: true, whatsapp: true } },
        },
      },
      milestones: { orderBy: { sortOrder: "asc" } },
      expenses: { orderBy: { expenseDate: "desc" }, take: 20 },
      payments: { orderBy: { dueDate: "asc" } },
      clientUpdates: { orderBy: { createdAt: "desc" }, take: 30 },
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          assignee: { select: { id: true, fullName: true, email: true } },
          milestone: { select: { id: true, title: true } },
        },
      },
      members: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
    },
  });

  if (!erpProject) return null;

  const progressPct = effectiveProjectProgress(
    erpProject.tasks,
    erpProject.milestones,
    erpProject.progressOverridePct
  );

  const finance = computeProjectFinance({
    budgetCents: erpProject.budgetCents,
    spentCents: erpProject.spentCents,
    revenueCents: erpProject.revenueCents,
    nextPaymentAt: erpProject.nextPaymentAt,
    nextPaymentCents: erpProject.nextPaymentCents,
    expenses: erpProject.expenses,
    payments: erpProject.payments,
  });

  const serviceProject = await prisma.project.findFirst({
    where: { erpProjectId, deletedAt: null },
    include: {
      services: {
        where: { deletedAt: null },
        include: {
          serviceDomain: true,
          serviceHosting: true,
          domainDocSubmissions: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              fullName: true,
              createdAt: true,
              updatedAt: true,
              reviewNotes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const [erpInvoices, serviceInvoices, auditLogs, projectResource] = await Promise.all([
    prisma.invoice.findMany({
      where: { projectId: erpProjectId, deletedAt: null },
      include: {
        payments: {
          where: { deletedAt: null, status: "SUCCEEDED" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    serviceProject
      ? prisma.invoice.findMany({
          where: { serviceProjectId: serviceProject.id, deletedAt: null },
          include: {
            payments: {
              where: { deletedAt: null, status: "SUCCEEDED" },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: "ErpProject", entityId: erpProjectId },
          ...(serviceProject ? [{ entityType: "Project", entityId: serviceProject.id }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        action: true,
        summary: true,
        module: true,
        actorEmail: true,
        createdAt: true,
      },
    }),
    prisma.projectResource.findFirst({
      where: { projectId: erpProjectId, deletedAt: null },
      select: {
        id: true,
        gitRepoUrl: true,
        gitProvider: true,
        defaultBranch: true,
        deploymentBranch: true,
        latestCommitSha: true,
        latestCommitMessage: true,
        latestCommitAt: true,
        repositoryStatus: true,
        devEnvironmentUrl: true,
        productionEnvironmentUrl: true,
        clientCanViewGit: true,
        deploymentMethod: true,
        lastDeployedAt: true,
        lastDeployedVersion: true,
        docsUrl: true,
        apiDocsUrl: true,
      },
    }),
  ]);

  if (serviceProject?.services?.length) {
    const emptyDomainIds = serviceProject.services
      .filter((s) => s.serviceDomain)
      .map((s) => s.serviceDomain!)
      .filter((d) => {
        const records = Array.isArray(d.dnsRecords) ? d.dnsRecords : [];
        return d.nameservers.length === 0 && records.length === 0;
      })
      .map((d) => d.id);

    if (emptyDomainIds.length > 0) {
      await Promise.all(emptyDomainIds.map((id) => ensureLiveDnsSyncedIfEmpty(id)));
      const refreshed = await prisma.serviceDomain.findMany({
        where: { id: { in: emptyDomainIds } },
      });
      const refreshedMap = new Map(refreshed.map((d) => [d.id, d]));
      for (const service of serviceProject.services) {
        if (service.serviceDomain && refreshedMap.has(service.serviceDomain.id)) {
          service.serviceDomain = refreshedMap.get(service.serviceDomain.id)!;
        }
      }
    }
  }

  const invoiceMap = new Map<string, ReturnType<typeof serializeInvoice>>();
  for (const inv of [...erpInvoices, ...serviceInvoices]) {
    invoiceMap.set(inv.id, serializeInvoice(inv));
  }
  const invoices = Array.from(invoiceMap.values());

  const receipts = [...erpInvoices, ...serviceInvoices].flatMap((inv) =>
    inv.payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      method: p.method,
      receiptNumber: p.receiptNumber,
      referenceNumber: p.referenceNumber,
      invoiceNumber: inv.invoiceNumber,
      createdAt: p.createdAt,
    }))
  );

  const billingSummary = invoices.reduce(
    (acc, inv) => {
      acc.invoicedCents += inv.totalCents;
      acc.paidCents += inv.paidCents;
      acc.balanceCents += inv.remainingBalanceCents;
      return acc;
    },
    { invoicedCents: 0, paidCents: 0, balanceCents: 0 }
  );

  const services = (serviceProject?.services ?? []).map((service) => {
    const base = serializeProjectService(service);
    const meta = readMetadata(service.metadata);
    const latestDoc = service.domainDocSubmissions[0] ?? null;
    return {
      ...base,
      label: getServiceTypeLabel(service.serviceType),
      serviceCostCents: centsFromMetadata(service.metadata, "serviceCostCents"),
      renewalCostCents: centsFromMetadata(service.metadata, "renewalCostCents"),
      assignedStaffId: typeof meta.assignedStaffId === "string" ? meta.assignedStaffId : null,
      progressPct: typeof meta.progressPct === "number" ? meta.progressPct : null,
      domain: service.serviceDomain ? serializeServiceDomain(service.serviceDomain) : null,
      hosting: service.serviceHosting ? serializeServiceHosting(service.serviceHosting) : null,
      documentation: latestDoc
        ? {
            id: latestDoc.id,
            status: latestDoc.status,
            submittedAt: latestDoc.createdAt,
            reviewedAt: latestDoc.updatedAt,
            reviewNotes: latestDoc.reviewNotes,
          }
        : null,
    };
  });

  const servicesByType = {
    domains: services.filter((s) => s.serviceType === "DOMAIN_REGISTRATION"),
    hosting: services.filter((s) => s.serviceType === "HOSTING"),
    security: services.filter((s) => s.serviceType === "SECURITY"),
    ssl: services.filter((s) => s.serviceType === "SSL_CERTIFICATE"),
    cloud: services.filter((s) => s.serviceType === "CLOUD_SERVICE"),
    email: services.filter((s) => s.serviceType === "EMAIL_HOSTING"),
    maintenance: services.filter((s) => s.serviceType === "MAINTENANCE"),
    other: services.filter(
      (s) =>
        ![
          "DOMAIN_REGISTRATION",
          "HOSTING",
          "SECURITY",
          "SSL_CERTIFICATE",
          "CLOUD_SERVICE",
          "EMAIL_HOSTING",
          "MAINTENANCE",
        ].includes(s.serviceType)
    ),
  };

  const pendingTasks = erpProject.tasks.filter((t) => t.status !== "DONE" && !t.parentId);
  const completedTasks = erpProject.tasks.filter((t) => t.status === "DONE" && !t.parentId);
  const completedMilestones = erpProject.milestones.filter((m) => m.status === "DONE").length;

  const activity = [
    ...erpProject.clientUpdates.map((u) => ({
      id: `update-${u.id}`,
      type: "client_update" as const,
      title: u.title,
      body: u.body,
      at: u.createdAt,
    })),
    ...auditLogs.map((a) => ({
      id: `audit-${a.id}`,
      type: "audit" as const,
      title: a.summary || a.action,
      body: a.actorEmail ? `By ${a.actorEmail}` : a.module,
      at: a.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 50);

  const renewals = services
    .filter((s) => s.renewalDate)
    .map((s) => ({
      serviceId: s.id,
      serviceType: s.serviceType,
      label: s.label,
      renewalDate: s.renewalDate,
      renewalCostCents: s.renewalCostCents,
      status: s.status,
    }))
    .sort((a, b) => {
      const ad = a.renewalDate ? new Date(a.renewalDate).getTime() : 0;
      const bd = b.renewalDate ? new Date(b.renewalDate).getTime() : 0;
      return ad - bd;
    });

  const dnsSummary = {
    totalDomains: servicesByType.domains.length,
    managedDomains: servicesByType.domains.filter((s) => s.domain?.purchasedViaMernCrest).length,
    totalRecords: servicesByType.domains.reduce(
      (acc, s) => acc + (s.domain?.dnsRecordCount ?? 0),
      0
    ),
    sslActive: servicesByType.domains.filter((s) => s.domain?.sslCertificateStatus === "ACTIVE")
      .length,
  };

  const deploymentStatus = projectResource
    ? {
        method: projectResource.deploymentMethod,
        lastDeployedAt: projectResource.lastDeployedAt,
        lastDeployedVersion: projectResource.lastDeployedVersion,
        devUrl: projectResource.devEnvironmentUrl,
        productionUrl: projectResource.productionEnvironmentUrl,
      }
    : null;

  return {
    erpProject: {
      id: erpProject.id,
      projectCode: erpProject.projectCode,
      name: erpProject.name,
      description: erpProject.description,
      status: erpProject.status,
      startDate: erpProject.startDate,
      endDate: erpProject.endDate,
      clientBrief: erpProject.clientBrief,
      nextSteps: erpProject.nextSteps,
      nextProcess: erpProject.nextProcess,
      developmentNotes: erpProject.developmentNotes,
      progressOverridePct: erpProject.progressOverridePct,
      department: erpProject.department,
    },
    client: erpProject.customer,
    progress: {
      percent: progressPct,
      currentMilestone: currentMilestoneLabel(erpProject.milestones),
      completedMilestones,
      totalMilestones: erpProject.milestones.length,
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
      totalTasks: erpProject.tasks.length,
    },
    team: erpProject.members.map((m) => ({
      role: m.role,
      user: m.user,
    })),
    milestones: erpProject.milestones,
    tasks: erpProject.tasks,
    payments: erpProject.payments,
    clientUpdates: erpProject.clientUpdates,
    finance,
    serviceProject: serviceProject
      ? {
          id: serviceProject.id,
          name: serviceProject.name,
          status: serviceProject.status,
        }
      : null,
    services,
    servicesByType,
    billing: {
      summary: billingSummary,
      invoices,
      receipts,
    },
    renewals,
    activity,
    resources: projectResource,
    dnsSummary,
    deploymentStatus,
  };
}

export type ProjectHubData = NonNullable<Awaited<ReturnType<typeof loadProjectHub>>>;
