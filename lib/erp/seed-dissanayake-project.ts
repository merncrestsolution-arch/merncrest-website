import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { dissanayakeDistributionErp as p } from "@/lib/data/projects/dissanayake-distribution-erp";

export async function seedDissanayakeDistributionErp(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  const owner = await prisma.user.findUnique({ where: { email: "owner@merncrest.lk" } });
  const staff = await prisma.user.findUnique({ where: { email: "staff@merncrest.lk" } });
  const techDept = await prisma.department.findUnique({ where: { code: "TECH" } });

  const customer = await prisma.user.upsert({
    where: { email: p.client.email },
    update: {
      fullName: p.client.contactName,
      company: p.client.company,
    },
    create: {
      email: p.client.email,
      fullName: p.client.contactName,
      company: p.client.company,
      passwordHash,
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          customerCode: p.client.customerCode,
          phone: p.client.phone,
          whatsapp: p.client.whatsapp,
          address: p.client.address,
          city: p.client.city,
          province: p.client.province,
          country: p.client.country,
          preferredLanguage: "en",
          timezone: "Asia/Colombo",
          customerRating: "GOOD",
          tagsJson: JSON.stringify(["DISTRIBUTION", "ERP", "HARDWARE", "ANURADHAPURA"]),
          notes: `${p.client.businessType}. Order ${p.orderNumber}.`,
        },
      },
    },
    include: { profile: true },
  });

  if (customer.profile) {
    await prisma.customerProfile.update({
      where: { id: customer.profile.id },
      data: {
        customerCode: p.client.customerCode,
        phone: p.client.phone,
        whatsapp: p.client.whatsapp,
        address: p.client.address,
        city: p.client.city,
        province: p.client.province,
        country: p.client.country,
        tagsJson: JSON.stringify(["DISTRIBUTION", "ERP", "HARDWARE", "ANURADHAPURA"]),
        notes: `${p.client.businessType}. Order ${p.orderNumber}.`,
      },
    });
  }

  const balanceDue = new Date();
  balanceDue.setDate(balanceDue.getDate() + 30);

  const project = await prisma.erpProject.upsert({
    where: { projectCode: p.projectCode },
    update: {
      name: p.name,
      description: buildDescription(),
      customerId: customer.id,
      departmentId: techDept?.id,
      status: p.status,
      revenueCents: p.financials.revenueCents,
      spentCents: p.financials.advanceCents,
      nextPaymentCents: p.financials.balanceCents,
      nextPaymentAt: balanceDue,
      clientBrief: p.clientBrief,
      nextSteps:
        "Complete Cloudflare security hardening, run UAT with client, resolve bugs, deploy to production, and collect final balance.",
      nextProcess: p.nextProcess,
      startDate: new Date("2026-06-01"),
    },
    create: {
      projectCode: p.projectCode,
      name: p.name,
      description: buildDescription(),
      customerId: customer.id,
      departmentId: techDept?.id,
      status: p.status,
      revenueCents: p.financials.revenueCents,
      spentCents: p.financials.advanceCents,
      nextPaymentCents: p.financials.balanceCents,
      nextPaymentAt: balanceDue,
      clientBrief: p.clientBrief,
      nextSteps:
        "Complete Cloudflare security hardening, run UAT with client, resolve bugs, deploy to production, and collect final balance.",
      nextProcess: p.nextProcess,
      startDate: new Date("2026-06-01"),
      members: {
        create: [
          ...(owner ? [{ userId: owner.id, role: "LEAD" as const }] : []),
          ...(staff ? [{ userId: staff.id, role: "MEMBER" as const }] : []),
          { userId: customer.id, role: "VIEWER" as const },
        ],
      },
    },
  });

  if (owner) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: owner.id } },
      update: { role: "LEAD" },
      create: { projectId: project.id, userId: owner.id, role: "LEAD" },
    });
  }
  if (staff) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: staff.id } },
      update: { role: "MEMBER" },
      create: { projectId: project.id, userId: staff.id, role: "MEMBER" },
    });
  }
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: customer.id } },
    update: { role: "VIEWER" },
    create: { projectId: project.id, userId: customer.id, role: "VIEWER" },
  });

  for (const m of p.milestones) {
    const existing = await prisma.projectMilestone.findFirst({
      where: { projectId: project.id, title: m.title },
    });
    if (existing) {
      await prisma.projectMilestone.update({
        where: { id: existing.id },
        data: { status: m.status, sortOrder: m.sortOrder },
      });
    } else {
      await prisma.projectMilestone.create({
        data: {
          projectId: project.id,
          title: m.title,
          status: m.status,
          sortOrder: m.sortOrder,
          dueDate: m.status === "IN_PROGRESS" ? balanceDue : new Date("2026-06-15"),
        },
      });
    }
  }

  for (const t of p.tasks) {
    const existing = await prisma.projectTask.findFirst({
      where: { projectId: project.id, title: t.title },
    });
    if (!existing) {
      await prisma.projectTask.create({
        data: {
          projectId: project.id,
          title: t.title,
          status: t.status,
          assigneeId: staff?.id,
        },
      });
    }
  }

  for (const pay of p.payments) {
    const existing = await prisma.projectPaymentSchedule.findFirst({
      where: { projectId: project.id, label: pay.label },
    });
    const dueDate = pay.status === "PAID" ? new Date("2026-06-01") : balanceDue;
    if (existing) {
      await prisma.projectPaymentSchedule.update({
        where: { id: existing.id },
        data: {
          amountCents: pay.amountCents,
          status: pay.status,
          sortOrder: pay.sortOrder,
          paidAt: pay.status === "PAID" ? new Date("2026-06-01") : null,
        },
      });
    } else {
      await prisma.projectPaymentSchedule.create({
        data: {
          projectId: project.id,
          label: pay.label,
          amountCents: pay.amountCents,
          dueDate,
          status: pay.status,
          sortOrder: pay.sortOrder,
          paidAt: pay.status === "PAID" ? new Date("2026-06-01") : null,
          notes: pay.status === "PAID" ? `Order ${p.orderNumber}` : "Due on project completion",
        },
      });
    }
  }

  const updateTitle = `Project proposal — ${p.orderNumber}`;
  const existingUpdate = await prisma.projectClientUpdate.findFirst({
    where: { projectId: project.id, title: updateTitle },
  });
  if (!existingUpdate) {
    await prisma.projectClientUpdate.create({
      data: {
        projectId: project.id,
        title: updateTitle,
        body: buildProposalSummary(),
        processStage: p.nextProcess,
        createdById: owner?.id,
      },
    });
  }

  const leadEmail = p.client.email;
  const existingLead = await prisma.crmLead.findFirst({
    where: { email: leadEmail, company: p.client.company },
  });
  if (!existingLead) {
    await prisma.crmLead.create({
      data: {
        leadNumber: p.orderNumber.replace(/\//g, "-"),
        fullName: p.client.contactName,
        email: leadEmail,
        phone: p.client.phone,
        company: p.client.company,
        interest: p.name,
        source: "DIRECT",
        stage: "WON",
        valueCents: p.financials.revenueCents,
        budgetCents: p.financials.revenueCents,
        priority: "HIGH",
        leadScore: 95,
        timeline: "Phase 3 — deployment in progress",
        ownerId: owner?.id,
        closedAt: new Date("2026-06-01"),
        wonReason: "Signed distribution ERP contract",
        notes: `Order ${p.orderNumber}. Advance LKR 50,000 received. Balance LKR 80,000 outstanding.`,
        tagsJson: JSON.stringify(["ERP", "DISTRIBUTION", "ANDROID"]),
      },
    });
  }

  await prisma.caseStudy.upsert({
    where: { slug: "dissanayake-distribution-erp" },
    update: {
      title: p.name,
      excerpt: p.clientBrief,
      industry: "Wholesale Distribution & Hardware",
      category: "Enterprise Software",
      techJson: JSON.stringify(p.techStack),
      problem:
        "Manual distribution operations, limited field-sales visibility, and no integrated inventory or credit tracking across routes.",
      solution:
        "Custom web ERP with Android field app — sales, inventory, finance, QR customer verification, GPS route tracking, and offline sync.",
      resultsJson: JSON.stringify([
        { label: "Project value", value: "LKR 130,000" },
        { label: "Platform", value: "Web ERP + Android" },
        { label: "Modules", value: String(p.modules.length) },
      ]),
      clientName: p.client.company,
      duration: "3 phases",
      featured: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
      seoTitle: `${p.name} | MernCrest Case Study`,
      seoDescription: p.clientBrief,
    },
    create: {
      slug: "dissanayake-distribution-erp",
      title: p.name,
      excerpt: p.clientBrief,
      industry: "Wholesale Distribution & Hardware",
      category: "Enterprise Software",
      techJson: JSON.stringify(p.techStack),
      problem:
        "Manual distribution operations, limited field-sales visibility, and no integrated inventory or credit tracking across routes.",
      solution:
        "Custom web ERP with Android field app — sales, inventory, finance, QR customer verification, GPS route tracking, and offline sync.",
      resultsJson: JSON.stringify([
        { label: "Project value", value: "LKR 130,000" },
        { label: "Platform", value: "Web ERP + Android" },
        { label: "Modules", value: String(p.modules.length) },
      ]),
      clientName: p.client.company,
      duration: "3 phases",
      featured: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
      seoTitle: `${p.name} | MernCrest Case Study`,
      seoDescription: p.clientBrief,
    },
  });

  return { customer, project };
}

function buildDescription() {
  return [
    `Order: ${p.orderNumber}`,
    `Client: ${p.client.company}`,
    `Type: Enterprise Distribution Management (Web ERP + Android)`,
    "",
    "Modules:",
    ...p.modules.map((m) => `• ${m}`),
    "",
    `Value: LKR ${(p.financials.revenueCents / 100).toLocaleString("en-LK")}`,
    `Advance received: LKR ${(p.financials.advanceCents / 100).toLocaleString("en-LK")}`,
    `Outstanding: LKR ${(p.financials.balanceCents / 100).toLocaleString("en-LK")}`,
  ].join("\n");
}

function buildProposalSummary() {
  return [
    `# ${p.name}`,
    `**Order:** ${p.orderNumber}`,
    `**Client:** ${p.client.company}`,
    `**Contact:** ${p.client.phone} · ${p.client.email}`,
    "",
    p.clientBrief,
    "",
    "**Payment status:** Partially paid — LKR 50,000 advance received, LKR 80,000 balance outstanding.",
    "",
    "**Current phase:** Phase 3 — Cloudflare security, performance optimization, UAT, and production deployment.",
  ].join("\n");
}
