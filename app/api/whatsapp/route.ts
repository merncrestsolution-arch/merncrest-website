import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { aiReply } from "@/lib/support/ai-replies";
import { nextNumber } from "@/lib/commerce";
import { z } from "zod";

/** Inbound WhatsApp webhook stub (Meta Cloud API shape simplified) */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone =
      body.phone ||
      body.from ||
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
      "unknown";
    const text =
      body.message ||
      body.text ||
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      "";

    if (!text) {
      return NextResponse.json({ error: "No message body" }, { status: 400 });
    }

    const inbound = await prisma.whatsAppMessage.create({
      data: {
        direction: "IN",
        phone: String(phone),
        body: String(text),
        status: "RECEIVED",
        waId: body.id || body.waId || null,
        metaJson: JSON.stringify(body).slice(0, 4000),
      },
    });

    const reply = aiReply(String(text), body.locale || "en");
    const outbound = await prisma.whatsAppMessage.create({
      data: {
        direction: "OUT",
        phone: String(phone),
        body: reply,
        status: "AI_REPLIED",
      },
    });

    // Auto-create ticket for handoff keywords
    let ticketNumber: string | null = null;
    if (/agent|human|support|help|ticket/i.test(String(text))) {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber("TKT"),
          guestName: `WhatsApp ${phone}`,
          guestEmail: null,
          subject: `WhatsApp: ${String(text).slice(0, 80)}`,
          department: "GENERAL",
          channel: "WHATSAPP",
          priority: "MEDIUM",
          status: "OPEN",
          messages: {
            create: {
              authorName: `WA ${phone}`,
              authorRole: "CUSTOMER",
              body: String(text),
            },
          },
        },
      });
      ticketNumber = ticket.ticketNumber;
    }

    return NextResponse.json({
      ok: true,
      inboundId: inbound.id,
      reply: outbound.body,
      ticketNumber,
      note: "Stub: connect Meta WhatsApp Cloud API credentials to send real outbound messages.",
    });
  } catch (error) {
    console.error("[whatsapp:webhook]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ messages });
}

const sendSchema = z.object({
  phone: z.string().min(8),
  message: z.string().min(1).max(2000),
});

/** Staff outbound (logged only until WA API keys configured) */
export async function PUT(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const msg = await prisma.whatsAppMessage.create({
    data: {
      direction: "OUT",
      phone: parsed.data.phone,
      body: parsed.data.message,
      status: "SENT",
    },
  });

  return NextResponse.json({
    message: msg,
    note: "Logged locally — configure WHATSAPP_TOKEN to deliver via Cloud API.",
  });
}
