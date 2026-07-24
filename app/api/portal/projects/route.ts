import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import { logCustomerActivity } from "@/lib/crm/customer-hooks";
import { notifyUser } from "@/lib/support/notify";
import { writeAuditLog } from "@/lib/erp/audit";
import {
  PORTAL_PROJECT_TYPES,
  projectTypeInterest,
  toPortalProject,
} from "@/lib/portal/project-types";

const typeValues = PORTAL_PROJECT_TYPES.map((t) => t.value) as [
  (typeof PORTAL_PROJECT_TYPES)[number]["value"],
  ...(typeof PORTAL_PROJECT_TYPES)[number]["value"][],
];

const requestSchema = z.object({
  serviceType: z.enum(typeValues),
  title: z.string().min(3).max(160),
  description: z.string().min(20).max(4000),
  budgetRange: z.string().max(80).optional(),
  timeline: z.string().max(80).optional(),
});

/** List customer-visible projects (ErpProject membership) */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const projects = await prisma.erpProject.findMany({
    where: {
      OR: [
        { customerId: auth.user.id },
        { members: { some: { userId: auth.user.id } } },
      ],
    },
    include: {
      milestones: { orderBy: { dueDate: "asc" } },
      tasks: { select: { status: true } },
      payments: { orderBy: { dueDate: "asc" } },
      clientUpdates: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    projects: projects.map(toPortalProject),
    serviceTypes: PORTAL_PROJECT_TYPES,
  });
}

/** Request custom software / website / mobile / other project → CRM */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please provide a valid project title and description (min 20 characters)." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    include: { profile: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { serviceType, title, description, budgetRange, timeline } = parsed.data;
  const interest = projectTypeInterest(serviceType);
  const activityBody = [
    `Portal project request · ${interest}`,
    `Title: ${title}`,
    budgetRange ? `Budget: ${budgetRange}` : null,
    timeline ? `Timeline: ${timeline}` : null,
    description,
  ]
    .filter(Boolean)
    .join("\n");

  const lead = await ensureLeadFromChannel({
    channel: "PORTAL",
    fullName: user.fullName,
    email: user.email,
    phone: user.profile?.phone,
    company: user.company,
    interest,
    activityType: "PROJECT_REQUEST",
    activityBody,
    channelRef: `portal-project:${user.id}`,
    userId: user.id,
  });

  await logCustomerActivity({
    userId: user.id,
    category: "PROJECT",
    title: `Project request: ${title}`,
    body: interest,
    href: "/portal/projects",
    meta: { serviceType, leadNumber: lead.leadNumber },
  });

  await notifyUser({
    userId: user.id,
    title: "Project request received",
    body: `We received “${title}”. Sales will follow up via CRM (${lead.leadNumber}).`,
    category: "PROJECT",
    href: "/portal/projects",
  });

  void writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorName: user.fullName,
    action: "PORTAL_PROJECT_REQUEST",
    module: "portal",
    entityType: "CrmLead",
    entityId: lead.id,
    summary: `Customer requested ${interest}: ${title}`,
    meta: { serviceType, title, leadNumber: lead.leadNumber },
  });

  return NextResponse.json(
    {
      ok: true,
      leadNumber: lead.leadNumber,
      message:
        "Your project request was sent to our team. You can track delivery here once a project is assigned to your account.",
    },
    { status: 201 }
  );
}
