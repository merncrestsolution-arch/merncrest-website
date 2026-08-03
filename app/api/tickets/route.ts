import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireUser } from "@/lib/commerce";
import { notifyUser } from "@/lib/support/notify";
import { publishTicketUpdate } from "@/lib/platform/publish";
import { onCustomerTicketCreated } from "@/lib/crm/customer-hooks";
import { getStaffScope, ticketScopeWhere } from "@/lib/erp/staff-scope";
import { defaultTenantStamp } from "@/lib/erp/scope-stamp";
import { z } from "zod";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
    const scope = isStaff ? await getStaffScope(auth.user) : null;
    const tickets = await prisma.ticket.findMany({
      where: isStaff
        ? ticketScopeWhere(scope!)
        : { userId: auth.user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
        user: { select: { email: true, fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[tickets:get]", error);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(5).max(5000),
  department: z.enum(["BILLING", "TECHNICAL", "SALES", "DOMAIN", "HOSTING", "GENERAL"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  channel: z.enum(["PORTAL", "LIVE_CHAT", "WHATSAPP", "EMAIL", "PHONE", "IVR"]).optional(),
});

const ticketDepartments = ["BILLING", "TECHNICAL", "SALES", "DOMAIN", "HOSTING", "GENERAL"] as const;
type TicketDepartment = typeof ticketDepartments[number];

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid ticket data" }, { status: 400 });
    }

    const priority = parsed.data.priority ?? "MEDIUM";
    const responseHours = priority === "URGENT" ? 1 : priority === "HIGH" ? 4 : 8;
    const resolveHours = priority === "URGENT" ? 8 : priority === "HIGH" ? 24 : 72;
    const now = Date.now();

    let department: TicketDepartment = parsed.data.department ?? "GENERAL";
    const category = "GENERAL";
    try {
      const { applyInboundRouting } = await import("@/lib/support/whatsapp-gateway");
      const route = await applyInboundRouting({
        source: (parsed.data.channel as "PORTAL" | "WHATSAPP" | "EMAIL" | "IVR") || "PORTAL",
        departmentHint: department,
      });
      if (
        route.department &&
        ticketDepartments.includes(route.department as TicketDepartment)
      ) {
        department = route.department as TicketDepartment;
      }
    } catch {
      /* routing optional */
    }

    const stamp = await defaultTenantStamp();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        ...stamp,
        userId: auth.user.id,
        subject: parsed.data.subject,
        department,
        category,
        priority,
        channel: parsed.data.channel ?? "PORTAL",
        status: "OPEN",
        responseDueAt: new Date(now + responseHours * 3600_000),
        resolveDueAt: new Date(now + resolveHours * 3600_000),
        messages: {
          create: {
            authorId: auth.user.id,
            authorName: auth.user.fullName,
            authorRole: "CUSTOMER",
            body: parsed.data.body,
          },
        },
      },
      include: { messages: true },
    });

    await notifyUser({
      userId: auth.user.id,
      title: `Ticket ${ticket.ticketNumber} opened`,
      body: ticket.subject,
      category: "SUPPORT",
      href: "/portal/tickets",
    });

    void onCustomerTicketCreated({
      userId: auth.user.id,
      email: auth.user.email,
      fullName: auth.user.fullName,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      department: ticket.department,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("[tickets:post]", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

const replySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1).max(5000).optional(),
  internal: z.boolean().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  action: z.enum(["reply", "claim", "close", "release", "escalate"]).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
    }

    const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
    const scope = isStaff ? await getStaffScope(auth.user) : null;
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parsed.data.ticketId,
        ...(isStaff ? ticketScopeWhere(scope!) : { userId: auth.user.id }),
      },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const action = parsed.data.action || "reply";

    // Staff claims an open/unassigned ticket (like taking an email)
    if (action === "claim") {
      if (!isStaff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          assigneeId: auth.user.id,
          assigneeName: auth.user.fullName,
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          user: { select: { email: true, fullName: true } },
        },
      });
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: auth.user.id,
          authorName: auth.user.fullName,
          authorRole: "SYSTEM",
          body: `${auth.user.fullName} claimed this ticket.`,
          internal: true,
        },
      });
      publishTicketUpdate(ticket.id);
      return NextResponse.json({ ticket: updated });
    }

    if (action === "release") {
      if (!isStaff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
      const updated = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { assigneeId: null, assigneeName: null, status: "OPEN" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          user: { select: { email: true, fullName: true } },
        },
      });
      publishTicketUpdate(ticket.id);
      return NextResponse.json({ ticket: updated });
    }

    if (action === "escalate") {
      if (!isStaff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
      const updated = await prisma.$transaction(async (tx) => {
        await tx.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            authorId: auth.user.id,
            authorName: auth.user.fullName,
            authorRole: "SYSTEM",
            body: `Escalated by ${auth.user.fullName} — priority raised.`,
            internal: true,
          },
        });
        return tx.ticket.update({
          where: { id: ticket.id },
          data: {
            priority: ticket.priority === "URGENT" ? "URGENT" : "HIGH",
            escalatedAt: new Date(),
            status: "IN_PROGRESS",
            assigneeId: auth.user.id,
            assigneeName: auth.user.fullName,
          },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            user: { select: { email: true, fullName: true } },
          },
        });
      });
      publishTicketUpdate(ticket.id);
      return NextResponse.json({ ticket: updated });
    }

    if (action === "close") {
      if (!isStaff) return NextResponse.json({ error: "Staff only" }, { status: 403 });
      const updated = await prisma.$transaction(async (tx) => {
        if (parsed.data.body?.trim()) {
          await tx.ticketMessage.create({
            data: {
              ticketId: ticket.id,
              authorId: auth.user.id,
              authorName: auth.user.fullName,
              authorRole: "STAFF",
              body: parsed.data.body,
            },
          });
        }
        await tx.ticketMessage.create({
          data: {
            ticketId: ticket.id,
            authorId: auth.user.id,
            authorName: auth.user.fullName,
            authorRole: "SYSTEM",
            body: `Ticket closed by ${auth.user.fullName}.`,
            internal: false,
          },
        });
        return tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "CLOSED",
            closedAt: new Date(),
            assigneeId: ticket.assigneeId || auth.user.id,
            assigneeName: ticket.assigneeName || auth.user.fullName,
          },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            user: { select: { email: true, fullName: true } },
          },
        });
      });
      if (ticket.userId) {
        await notifyUser({
          userId: ticket.userId,
          title: `${ticket.ticketNumber} closed`,
          body: "Your support request was closed. Rate your experience in Portal → Tickets.",
          category: "SUPPORT",
          href: "/portal/tickets",
        });
      }
      publishTicketUpdate(ticket.id);
      return NextResponse.json({ ticket: updated });
    }

    // Default: reply (email-style thread)
    if (!parsed.data.body?.trim()) {
      return NextResponse.json({ error: "Message body required" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: auth.user.id,
          authorName: auth.user.fullName,
          authorRole: isStaff ? "STAFF" : "CUSTOMER",
          body: parsed.data.body!,
          internal: isStaff ? Boolean(parsed.data.internal) : false,
        },
      });

      return tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: parsed.data.status ?? (isStaff ? "IN_PROGRESS" : "WAITING"),
          assigneeId: isStaff ? ticket.assigneeId || auth.user.id : ticket.assigneeId,
          assigneeName: isStaff ? ticket.assigneeName || auth.user.fullName : ticket.assigneeName,
          closedAt:
            parsed.data.status === "CLOSED" || parsed.data.status === "RESOLVED"
              ? new Date()
              : ticket.closedAt,
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
          user: { select: { email: true, fullName: true } },
        },
      });
    });

    if (isStaff && ticket.userId) {
      await notifyUser({
        userId: ticket.userId,
        title: `Reply on ${ticket.ticketNumber}`,
        body: parsed.data.body.slice(0, 120),
        category: "SUPPORT",
        href: "/portal/tickets",
      });
    }
    if (!isStaff) {
      // Notify assigned staff or all admins lightly via assignee
      if (ticket.assigneeId) {
        await notifyUser({
          userId: ticket.assigneeId,
          title: `Customer reply · ${ticket.ticketNumber}`,
          body: parsed.data.body.slice(0, 120),
          category: "SUPPORT",
          href: "/staff/tickets",
        });
      }
    }

    publishTicketUpdate(updated.id);
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error("[tickets:patch]", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

/** Staff status update or customer CSAT */
export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const schema = z.object({
      ticketId: z.string(),
      status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
      assigneeName: z.string().optional(),
      csatRating: z.number().int().min(1).max(5).optional(),
      csatFeedback: z.string().max(1000).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
    const scope = isStaff ? await getStaffScope(auth.user) : null;
    const existing = await prisma.ticket.findFirst({
      where: {
        id: parsed.data.ticketId,
        ...(isStaff ? ticketScopeWhere(scope!) : { userId: auth.user.id }),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // CSAT only when resolved/closed
    if (parsed.data.csatRating != null && !isStaff) {
      if (!["RESOLVED", "CLOSED"].includes(existing.status)) {
        return NextResponse.json({ error: "Rate after ticket is resolved" }, { status: 400 });
      }
      const ticket = await prisma.ticket.update({
        where: { id: existing.id },
        data: {
          csatRating: parsed.data.csatRating,
          csatFeedback: parsed.data.csatFeedback,
        },
      });
      return NextResponse.json({ ticket, message: "Thank you for your feedback" });
    }

    if (!isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ticket = await prisma.ticket.update({
      where: { id: parsed.data.ticketId },
      data: {
        status: parsed.data.status,
        assigneeId: auth.user.id,
        assigneeName: parsed.data.assigneeName ?? auth.user.fullName,
        closedAt:
          parsed.data.status === "CLOSED" || parsed.data.status === "RESOLVED"
            ? new Date()
            : null,
      },
    });

    if (
      ticket.userId &&
      (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED")
    ) {
      await notifyUser({
        userId: ticket.userId,
        title: `${ticket.ticketNumber} resolved`,
        body: "Please rate your support experience (1–5 stars) in Portal → Tickets.",
        category: "SUPPORT",
        href: "/portal/tickets",
      });
      const { notifyTicketWhatsApp } = await import("@/lib/crm/whatsapp-notify");
      void notifyTicketWhatsApp({
        userId: ticket.userId,
        ticketNumber: ticket.ticketNumber,
        status: parsed.data.status || "RESOLVED",
      });
    }

    publishTicketUpdate(ticket.id);
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[tickets:put]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
