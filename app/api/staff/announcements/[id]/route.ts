import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { isAdminRole } from "@/lib/auth";
import { publishAnnouncement } from "@/lib/announcements/publish";
import { writeAuditLog } from "@/lib/erp/audit";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const row = await prisma.announcement.findFirst({
    where: { id, deletedAt: null },
  });
  if (!row) return apiError("NOT_FOUND", "Announcement not found", 404);
  return apiSuccess(row);
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  bodyHtml: z.string().max(20000).optional().nullable(),
  tone: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  href: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "EXPIRED"]).optional(),
  audience: z.enum(["ALL_STAFF", "ROLE", "TEAM"]).optional(),
  audienceRoles: z.array(z.string()).optional(),
  scheduledFor: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "announcements.manage");
  if (!canManage && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", "Missing announcements.manage permission", 403);
  }

  const { id } = await context.params;
  const existing = await prisma.announcement.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Not found", 404);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION", "Invalid update");

  const data: Record<string, unknown> = { updatedBy: auth.user.id };
  if (parsed.data.title) data.title = parsed.data.title;
  if (parsed.data.body) data.body = parsed.data.body;
  if (parsed.data.bodyHtml !== undefined) data.bodyHtml = parsed.data.bodyHtml;
  if (parsed.data.tone) data.tone = parsed.data.tone;
  if (parsed.data.href !== undefined) data.href = parsed.data.href || null;
  if (parsed.data.audience) data.audience = parsed.data.audience;
  if (parsed.data.audienceRoles) {
    data.audienceJson = JSON.stringify(parsed.data.audienceRoles);
  }
  if (parsed.data.endsAt !== undefined) {
    data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  }
  if (parsed.data.status) {
    data.status = parsed.data.status;
    data.active = parsed.data.status === "PUBLISHED";
    if (parsed.data.status === "PUBLISHED") data.publishedAt = new Date();
    if (parsed.data.status === "EXPIRED") data.active = false;
  }
  if (parsed.data.scheduledFor !== undefined) {
    data.scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
  }

  const updated = await prisma.announcement.update({ where: { id }, data });

  if (parsed.data.status === "PUBLISHED") {
    await publishAnnouncement(id);
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "announcement.update",
    module: "announcements",
    entityId: id,
    entityType: "Announcement",
    summary: `Updated announcement: ${updated.title}`,
  });

  return apiSuccess(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "announcements.manage");
  if (!canManage && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", "Missing announcements.manage permission", 403);
  }

  const { id } = await context.params;
  const existing = await prisma.announcement.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return apiError("NOT_FOUND", "Not found", 404);

  await prisma.announcement.update({
    where: { id },
    data: { deletedAt: new Date(), status: "EXPIRED", active: false, updatedBy: auth.user.id },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "announcement.delete",
    module: "announcements",
    entityId: id,
    entityType: "Announcement",
    summary: `Deleted announcement: ${existing.title}`,
  });

  return apiSuccess({ id });
}
