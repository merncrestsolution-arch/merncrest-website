import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireUser } from "@/lib/commerce";
import { notifyUser } from "@/lib/support/notify";
import { onCustomerTicketCreated } from "@/lib/crm/customer-hooks";
import { z } from "zod";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
    const tickets = await prisma.ticket.findMany({
      where: isStaff ? undefined : { userId: auth.user.id },
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

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid ticket data" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        userId: auth.user.id,
        subject: parsed.data.subject,
        department: parsed.data.department ?? "GENERAL",
        priority: parsed.data.priority ?? "MEDIUM",
        channel: parsed.data.channel ?? "PORTAL",
        status: "OPEN",
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
  body: z.string().min(1).max(5000),
  internal: z.boolean().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
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
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: parsed.data.ticketId,
        ...(isStaff ? {} : { userId: auth.user.id }),
      },
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: auth.user.id,
          authorName: auth.user.fullName,
          authorRole: isStaff ? "STAFF" : "CUSTOMER",
          body: parsed.data.body,
          internal: isStaff ? Boolean(parsed.data.internal) : false,
        },
      });

      return tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: parsed.data.status ?? (isStaff ? "IN_PROGRESS" : "WAITING"),
          assigneeName: isStaff ? auth.user.fullName : ticket.assigneeName,
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
    const existing = await prisma.ticket.findFirst({
      where: {
        id: parsed.data.ticketId,
        ...(isStaff ? {} : { userId: auth.user.id }),
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
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("[tickets:put]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
