import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";
import { complaintAnalytics } from "@/lib/erp/complaints";

export async function GET(request: Request) {
  const auth = await requirePermission(["erp.analytics.view", "erp.hr.view"]);
  if (auth.error) {
    const staff = await requireStaff();
    if (staff.error) return auth.error;
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "analytics") {
    const analytics = await complaintAnalytics(Number(searchParams.get("days") || 30));
    return NextResponse.json({ analytics });
  }

  const complaints = await prisma.complaint.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      assignee: { select: { fullName: true } },
      filer: { select: { fullName: true } },
    },
  });
  return NextResponse.json({ complaints });
}

const createSchema = z.object({
  source: z.enum(["WEB", "WHATSAPP", "PHONE", "PORTAL", "INTERNAL"]).optional(),
  type: z.enum(["CUSTOMER", "GRIEVANCE"]).optional(),
  category: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  subject: z.string().min(2),
  body: z.string().min(2),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  guestEmail: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  // Public-ish intake: staff or unauthenticated web form via staff session preferred
  const staff = await requireStaff();
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid complaint" }, { status: 400 });
  }

  const complaint = await prisma.complaint.create({
    data: {
      complaintNumber: nextNumber("CMP"),
      source: parsed.data.source || "WEB",
      type: parsed.data.type || "CUSTOMER",
      category: parsed.data.category || "GENERAL",
      severity: parsed.data.severity || "MEDIUM",
      subject: parsed.data.subject,
      body: parsed.data.body,
      guestName: parsed.data.guestName,
      guestPhone: parsed.data.guestPhone,
      guestEmail: parsed.data.guestEmail,
      userId: parsed.data.userId || staff.user?.id,
      status: "OPEN",
    },
  });

  // Link CRM / ticket for customer complaints
  if (parsed.data.type !== "GRIEVANCE") {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        userId: parsed.data.userId,
        guestName: parsed.data.guestName || parsed.data.subject,
        guestEmail: parsed.data.guestEmail,
        subject: `[Complaint] ${parsed.data.subject}`,
        department: "GENERAL",
        priority:
          parsed.data.severity === "CRITICAL"
            ? "URGENT"
            : parsed.data.severity === "HIGH"
              ? "HIGH"
              : "MEDIUM",
        channel: parsed.data.source === "WHATSAPP" ? "WHATSAPP" : parsed.data.source === "PHONE" ? "PHONE" : "PORTAL",
        category: "COMPLAINT",
        status: "OPEN",
        messages: {
          create: {
            authorName: parsed.data.guestName || "Complainant",
            authorRole: "CUSTOMER",
            body: parsed.data.body,
          },
        },
      },
    });
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: { ticketId: ticket.id },
    });
  }

  if (staff.user) {
    void writeAuditLog({
      actorId: staff.user.id,
      actorEmail: staff.user.email,
      actorName: staff.user.fullName,
      action: "CREATE",
      module: "COMPLAINTS",
      entityType: "Complaint",
      entityId: complaint.id,
      summary: `${complaint.complaintNumber} ${complaint.subject}`,
    });
  }

  return NextResponse.json({ complaint }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["assign", "status", "rca", "resolve", "csat", "followup"]).optional(),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  rootCause: z.string().optional(),
  resolution: z.string().optional(),
  preventionNotes: z.string().optional(),
  csatScore: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const d = parsed.data;
  const action = d.action || "status";

  if (action === "assign" && d.assigneeId) {
    const complaint = await prisma.complaint.update({
      where: { id: d.id },
      data: { assigneeId: d.assigneeId, status: "ASSIGNED" },
    });
    await notifyUser({
      userId: d.assigneeId,
      title: `Complaint assigned ${complaint.complaintNumber}`,
      body: complaint.subject,
      category: "SUPPORT",
      href: "/admin/erp/complaints",
    });
    return NextResponse.json({ complaint });
  }

  if (action === "rca") {
    const complaint = await prisma.complaint.update({
      where: { id: d.id },
      data: {
        rootCause: d.rootCause,
        preventionNotes: d.preventionNotes,
        status: "IN_PROGRESS",
      },
    });
    return NextResponse.json({ complaint });
  }

  if (action === "resolve") {
    const complaint = await prisma.complaint.update({
      where: { id: d.id },
      data: {
        resolution: d.resolution,
        preventionNotes: d.preventionNotes,
        rootCause: d.rootCause,
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });
    // Follow-up CSAT nudge
    if (complaint.userId) {
      await notifyUser({
        userId: complaint.userId,
        title: "How was your complaint resolution?",
        body: `Please rate ${complaint.complaintNumber}. Reply with 1–5.`,
        category: "SUPPORT",
      });
    }
    return NextResponse.json({ complaint });
  }

  if (action === "csat" && d.csatScore != null) {
    const complaint = await prisma.complaint.update({
      where: { id: d.id },
      data: { csatScore: d.csatScore, status: "CLOSED" },
    });
    await prisma.customerSatisfaction.create({
      data: {
        userId: complaint.userId || undefined,
        channel: "GENERAL",
        referenceId: complaint.id,
        rating: d.csatScore,
        feedback: "Post-complaint survey",
      },
    });
    return NextResponse.json({ complaint });
  }

  if (action === "followup") {
    const c = await prisma.complaint.findUnique({ where: { id: d.id } });
    if (c?.assigneeId) {
      await notifyUser({
        userId: c.assigneeId,
        title: `Follow-up due · ${c.complaintNumber}`,
        body: c.subject,
        category: "SUPPORT",
        href: "/admin/erp/complaints",
      });
    }
    return NextResponse.json({ ok: true });
  }

  const complaint = await prisma.complaint.update({
    where: { id: d.id },
    data: { status: d.status },
  });
  return NextResponse.json({ complaint });
}
