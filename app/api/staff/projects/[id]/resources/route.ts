import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { isAdminRole } from "@/lib/auth";
import { requireProjectAccess, canMutateProject } from "@/lib/projects/access";
import { hasStaffPermission } from "@/lib/staff/permissions";
import {
  decryptCredentials,
  decryptEnvVars,
  encryptCredentials,
  encryptEnvVars,
  maskCredentials,
  maskEnvVars,
  type ProjectCredentialEntry,
} from "@/lib/security/project-secrets";
import { writeAuditLog } from "@/lib/erp/audit";

function serializeResource(r: {
  id: string;
  projectId: string;
  gitRepoUrl: string | null;
  sourceCodeNotes: string | null;
  docsUrl: string | null;
  apiDocsUrl: string | null;
  deploymentMethod: string | null;
  lastDeployedAt: Date | null;
  lastDeployedVersion: string | null;
  hostingAccountId: string | null;
  domainId: string | null;
  envVarsEncrypted: string | null;
  credentialsEncrypted: string | null;
  hostingAccount?: {
    id: string;
    label: string;
    panelUrl: string | null;
    serverIp: string | null;
  } | null;
  domain?: { id: string; name: string; tld: string } | null;
}) {
  const envVars = decryptEnvVars(r.envVarsEncrypted);
  const credentials = decryptCredentials(r.credentialsEncrypted);

  return {
    id: r.id,
    projectId: r.projectId,
    gitRepoUrl: r.gitRepoUrl,
    sourceCodeNotes: r.sourceCodeNotes,
    docsUrl: r.docsUrl,
    apiDocsUrl: r.apiDocsUrl,
    deploymentMethod: r.deploymentMethod,
    lastDeployedAt: r.lastDeployedAt,
    lastDeployedVersion: r.lastDeployedVersion,
    hostingAccountId: r.hostingAccountId,
    domainId: r.domainId,
    hostingAccount: r.hostingAccount
      ? {
          id: r.hostingAccount.id,
          label: r.hostingAccount.label,
          panelUrl: r.hostingAccount.panelUrl,
          serverIp: r.hostingAccount.serverIp,
        }
      : null,
    domain: r.domain
      ? { id: r.domain.id, fqdn: `${r.domain.name}.${r.domain.tld}` }
      : null,
    hasEnvVars: Boolean(r.envVarsEncrypted),
    hasCredentials: Boolean(r.credentialsEncrypted),
    envVarsMasked: maskEnvVars(envVars),
    credentialsMasked: maskCredentials(credentials),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const access = await requireProjectAccess(auth.user, projectId, "view");
  if (!access.ok && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", access.message, 403);
  }

  let resource = await prisma.projectResource.findFirst({
    where: { projectId, deletedAt: null },
    include: {
      hostingAccount: {
        select: { id: true, label: true, panelUrl: true, serverIp: true },
      },
      domain: { select: { id: true, name: true, tld: true } },
    },
  });

  if (!resource) {
    resource = await prisma.projectResource.create({
      data: { projectId, createdBy: auth.user.id },
      include: {
        hostingAccount: {
          select: { id: true, label: true, panelUrl: true, serverIp: true },
        },
        domain: { select: { id: true, name: true, tld: true } },
      },
    });
  }

  return apiSuccess(serializeResource(resource));
}

const patchSchema = z.object({
  gitRepoUrl: z.string().optional().nullable(),
  sourceCodeNotes: z.string().optional().nullable(),
  docsUrl: z.string().optional().nullable(),
  apiDocsUrl: z.string().optional().nullable(),
  deploymentMethod: z.string().optional().nullable(),
  lastDeployedAt: z.string().optional().nullable(),
  lastDeployedVersion: z.string().optional().nullable(),
  hostingAccountId: z.string().optional().nullable(),
  domainId: z.string().optional().nullable(),
  envVars: z.record(z.string()).optional(),
  credentials: z
    .array(
      z.object({
        label: z.string().min(1),
        username: z.string().optional(),
        password: z.string().optional(),
        url: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id: projectId } = await context.params;
  const canEdit =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "projects.manage")) ||
    (await canMutateProject(auth.user, projectId));
  if (!canEdit) return apiError("FORBIDDEN", "Requires project edit access", 403);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid resource data");

  const existing = await prisma.projectResource.findFirst({
    where: { projectId, deletedAt: null },
  });

  const data: Record<string, unknown> = {
    updatedBy: auth.user.id,
    gitRepoUrl: parsed.data.gitRepoUrl,
    sourceCodeNotes: parsed.data.sourceCodeNotes,
    docsUrl: parsed.data.docsUrl,
    apiDocsUrl: parsed.data.apiDocsUrl,
    deploymentMethod: parsed.data.deploymentMethod,
    lastDeployedVersion: parsed.data.lastDeployedVersion,
    hostingAccountId: parsed.data.hostingAccountId,
    domainId: parsed.data.domainId,
  };

  if (parsed.data.lastDeployedAt !== undefined) {
    data.lastDeployedAt = parsed.data.lastDeployedAt
      ? new Date(parsed.data.lastDeployedAt)
      : null;
  }

  if (parsed.data.envVars) {
    data.envVarsEncrypted = encryptEnvVars(parsed.data.envVars);
  }

  if (parsed.data.credentials) {
    data.credentialsEncrypted = encryptCredentials(
      parsed.data.credentials as ProjectCredentialEntry[]
    );
  }

  const resource = existing
    ? await prisma.projectResource.update({
        where: { id: existing.id },
        data,
        include: {
          hostingAccount: {
            select: { id: true, label: true, panelUrl: true, serverIp: true },
          },
          domain: { select: { id: true, name: true, tld: true } },
        },
      })
    : await prisma.projectResource.create({
        data: {
          projectId,
          createdBy: auth.user.id,
          ...data,
        },
        include: {
          hostingAccount: {
            select: { id: true, label: true, panelUrl: true, serverIp: true },
          },
          domain: { select: { id: true, name: true, tld: true } },
        },
      });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "project.resource.update",
    module: "projects",
    entityType: "ProjectResource",
    entityId: resource.id,
    summary: `Updated project resources for ${projectId}`,
    meta: { projectId },
  });

  return apiSuccess(serializeResource(resource));
}
