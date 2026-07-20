import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { z } from "zod";

/** Inbound support email → ticket (webhook stub for IMAP/SendGrid/etc.) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schema = z.object({
      from: z.string().email(),
      fromName: z.string().optional(),
      subject: z.string().min(1),
      text: z.string().min(1),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email payload" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.from.toLowerCase() } });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: nextNumber("TKT"),
        userId: user?.id,
        guestEmail: parsed.data.from,
        guestName: parsed.data.fromName || user?.fullName || parsed.data.from,
        subject: parsed.data.subject,
        department: /invoice|bill|pay/i.test(parsed.data.subject) ? "BILLING" : "GENERAL",
        priority: parsed.data.priority ?? "MEDIUM",
        channel: "EMAIL",
        status: "OPEN",
        messages: {
          create: {
            authorId: user?.id,
            authorName: parsed.data.fromName || parsed.data.from,
            authorRole: "CUSTOMER",
            body: parsed.data.text,
          },
        },
      },
    });

    const { ensureLeadFromChannel } = await import("@/lib/crm/channels");
    await ensureLeadFromChannel({
      channel: "EMAIL",
      fullName: parsed.data.fromName || user?.fullName || parsed.data.from,
      email: parsed.data.from,
      interest: parsed.data.subject,
      activityType: "EMAIL",
      activityBody: `Email → ${ticket.ticketNumber}: ${parsed.data.subject}`,
      channelRef: ticket.id,
      userId: user?.id,
    });

    return NextResponse.json({
      ticket,
      message: `Email converted to ${ticket.ticketNumber}`,
    }, { status: 201 });
  } catch (error) {
    console.error("[email:inbound]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const tickets = await prisma.ticket.findMany({
    where: { channel: "EMAIL" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ tickets });
}
