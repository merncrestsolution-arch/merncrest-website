import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { decryptCredential } from "@/lib/security/credentials";
import { writeAuditLog } from "@/lib/erp/audit";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";

const revealSchema = z.object({
  field: z.enum([
    "panelUsername",
    "panelPassword",
    "databaseUsername",
    "databasePassword",
  ]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canReveal = await hasStaffPermission(auth.user, "hosting.credentials.reveal");
  if (!canReveal) {
    return apiError("FORBIDDEN", "Missing hosting.credentials.reveal permission", 403);
  }

  const rl = rateLimit({
    key: `hosting:reveal:${auth.user.id}:${clientIp(request)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return apiError("RATE_LIMIT", "Too many credential reveal requests.", 429);
  }

  const { id } = await context.params;
  const account = await prisma.hostingAccount.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      label: true,
      panelUsernameEncrypted: true,
      panelPasswordEncrypted: true,
      databaseUsernameEncrypted: true,
      databasePasswordEncrypted: true,
    },
  });

  if (!account) return apiError("NOT_FOUND", "Hosting account not found", 404);

  const body = await request.json();
  const parsed = revealSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", "Invalid credential field");
  }

  const fieldMap = {
    panelUsername: account.panelUsernameEncrypted,
    panelPassword: account.panelPasswordEncrypted,
    databaseUsername: account.databaseUsernameEncrypted,
    databasePassword: account.databasePasswordEncrypted,
  };

  const encrypted = fieldMap[parsed.data.field];
  if (!encrypted) {
    return apiError("NOT_FOUND", "No credential stored for this field", 404);
  }

  const value = decryptCredential(encrypted);
  if (!value) {
    return apiError("DECRYPT_FAILED", "Could not decrypt credential", 500);
  }

  const revealedAt = new Date();

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "hosting.credentials.reveal",
    module: "hosting",
    entityType: "HostingAccount",
    entityId: id,
    summary: `Revealed ${parsed.data.field} for hosting account ${account.label}`,
    meta: {
      field: parsed.data.field,
      revealedBy: auth.user.id,
      revealedAt: revealedAt.toISOString(),
    },
  });

  return apiSuccess({
    field: parsed.data.field,
    value,
    revealedBy: auth.user.id,
    revealedAt,
  });
}
