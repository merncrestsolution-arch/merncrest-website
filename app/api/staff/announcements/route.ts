import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { isAdminRole } from "@/lib/auth";
import {
  matchesStaffAudience,
  publishAnnouncement,
  publishDueAnnouncements,
} from "@/lib/announcements/publish";
import { writeAuditLog } from "@/lib/erp/audit";

function serializeAnnouncement(a: {
  id: string;
  title: string;
  body: string;
  bodyHtml: string | null;
  tone: string;
  href: string | null;
  surface: string;
  status: string;
  audience: string;
  audienceJson: string | null;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  startsAt: Date;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    title: a.title,
    body: a.body,
    bodyHtml: a.bodyHtml,
    tone: a.tone,
    href: a.href,
    surface: a.surface,
    status: a.status,
    audience: a.audience,
    audienceJson: a.audienceJson,
    scheduledFor: a.scheduledFor,
    publishedAt: a.publishedAt,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** Staff announcement feed or admin list */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const admin = new URL(request.url).searchParams.get("admin") === "1";
  const canManage =
    isAdminRole(auth.user.role) ||
    (await hasStaffPermission(auth.user, "announcements.manage"));

  if (admin && canManage) {
    const rows = await prisma.announcement.findMany({
      where: {
        deletedAt: null,
        surface: { in: ["STAFF", "BOTH"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return apiSuccess(rows.map(serializeAnnouncement));
  }

  await publishDueAnnouncements();

  const now = new Date();
  const rows = await prisma.announcement.findMany({
    where: {
      deletedAt: null,
      surface: { in: ["STAFF", "BOTH"] },
      status: "PUBLISHED",
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const visible = rows.filter((a) =>
    matchesStaffAudience(auth.user.id, auth.user.role, a.audience, a.audienceJson)
  );

  return apiSuccess(visible.map(serializeAnnouncement));
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  bodyHtml: z.string().max(20000).optional(),
  tone: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  href: z.string().url().optional().or(z.literal("")),
  surface: z.enum(["STAFF", "BOTH"]).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]).optional(),
  audience: z.enum(["ALL_STAFF", "ROLE", "TEAM"]).optional(),
  audienceRoles: z.array(z.string()).optional(),
  scheduledFor: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canManage = await hasStaffPermission(auth.user, "announcements.manage");
  if (!canManage && !isAdminRole(auth.user.role)) {
    return apiError("FORBIDDEN", "Missing announcements.manage permission", 403);
  }

  const body = await request.json();

  if (body.action === "publish-due") {
    const result = await publishDueAnnouncements();
    return apiSuccess(result);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid");
  }

  const status = parsed.data.status ?? "DRAFT";
  const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;

  let audienceJson: string | null = null;
  if (parsed.data.audience === "ROLE" && parsed.data.audienceRoles) {
    audienceJson = JSON.stringify(parsed.data.audienceRoles);
  } else if (parsed.data.audience === "TEAM" && parsed.data.audienceRoles) {
    audienceJson = JSON.stringify(parsed.data.audienceRoles);
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      bodyHtml: parsed.data.bodyHtml || null,
      tone: parsed.data.tone ?? "INFO",
      href: parsed.data.href || null,
      surface: parsed.data.surface ?? "STAFF",
      status,
      audience: parsed.data.audience ?? "ALL_STAFF",
      audienceJson,
      scheduledFor: status === "SCHEDULED" ? scheduledFor : null,
      active: status === "PUBLISHED",
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      endsAt,
      createdBy: auth.user.id,
      updatedBy: auth.user.id,
    },
  });

  if (status === "PUBLISHED") {
    await publishAnnouncement(announcement.id);
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: "announcement.create",
    module: "announcements",
    entityType: "Announcement",
    entityId: announcement.id,
    summary: `Created announcement: ${announcement.title}`,
    meta: { status, audience: announcement.audience },
  });

  return apiSuccess(serializeAnnouncement(announcement), undefined, 201);
}
