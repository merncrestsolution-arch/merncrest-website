import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { normalizeWhatsAppPhone } from "@/lib/support/whatsapp-phone";
import { z } from "zod";

/**
 * Meta Cloud API webhook verification (GET) + inbound (POST).
 * Business line: 0713838638 (+94713838638)
 *
 * Subscribe in Meta: messages, message_template_status_update,
 * message_deliveries / statuses, message_reads, message_reactions,
 * phone_number_quality_update, phone_number_name_update
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verify = process.env.WHATSAPP_VERIFY_TOKEN || "merncrest-verify";

  // Meta webhook verification
  if (mode === "subscribe") {
    if (token === verify && challenge) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new NextResponse("Forbidden", { status: 403 });
  }

  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { getWhatsAppConnectionStatus } = await import("@/lib/support/whatsapp-meta");
  const status = await getWhatsAppConnectionStatus();
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ messages, status, businessNumber: "0713838638" });
}

/** Inbound WhatsApp webhook */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const change = body?.entry?.[0]?.changes?.[0];
    const field = change?.field as string | undefined;
    const value = change?.value;

    // Template approval status updates
    if (field === "message_template_status_update" || value?.message_template_name) {
      const { applyTemplateStatusUpdate } = await import("@/lib/crm/whatsapp-inbound");
      const events = Array.isArray(value) ? value : [value || body];
      for (const ev of events) {
        if (ev?.message_template_name || ev?.event) {
          await applyTemplateStatusUpdate(ev);
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Delivery / read receipts
    const statuses = value?.statuses;
    if (Array.isArray(statuses) && statuses.length) {
      for (const st of statuses) {
        const waId = st.id as string | undefined;
        const status = String(st.status || "").toUpperCase();
        if (!waId) continue;
        const map: Record<string, string> = {
          SENT: "SENT",
          DELIVERED: "DELIVERED",
          READ: "READ",
          FAILED: "FAILED",
        };
        if (map[status]) {
          await prisma.whatsAppMessage.updateMany({
            where: { waId },
            data: { status: map[status] },
          });
        }
      }
      // If no messages in same payload, ack
      if (!value?.messages?.length) {
        return NextResponse.json({ ok: true, statuses: statuses.length });
      }
    }

    // Phone quality / name updates — store on gateway config
    if (
      field === "phone_number_quality_update" ||
      field === "phone_number_name_update"
    ) {
      const gw = await prisma.systemGatewayConfig.findUnique({
        where: { provider: "WHATSAPP" },
      });
      let config: Record<string, unknown> = {};
      try {
        config = gw?.configJson ? JSON.parse(gw.configJson) : {};
      } catch {
        config = {};
      }
      config.metaPhoneEvents = {
        ...(typeof config.metaPhoneEvents === "object" ? config.metaPhoneEvents : {}),
        [field]: value,
        at: new Date().toISOString(),
      };
      if (value?.current_limit) config.qualityRating = value.current_limit;
      if (value?.display_phone_number) {
        config.metaDisplayPhone = value.display_phone_number;
      }
      await prisma.systemGatewayConfig.upsert({
        where: { provider: "WHATSAPP" },
        create: {
          provider: "WHATSAPP",
          active: true,
          configJson: JSON.stringify(config),
        },
        update: { configJson: JSON.stringify(config) },
      });
      return NextResponse.json({ ok: true, field });
    }

    // Reactions — log lightly
    if (field === "messages" && value?.messages?.[0]?.type === "reaction") {
      return NextResponse.json({ ok: true, reaction: true });
    }

    const msg = value?.messages?.[0];
    const contact = value?.contacts?.[0];
    const rawPhone =
      body.phone ||
      body.from ||
      msg?.from ||
      "unknown";
    const text =
      body.message ||
      body.text ||
      msg?.text?.body ||
      msg?.button?.text ||
      msg?.interactive?.button_reply?.title ||
      "";

    if (!text) {
      if (body.object === "whatsapp_business_account") {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { processInboundWhatsApp } = await import("@/lib/crm/whatsapp-inbound");
    const result = await processInboundWhatsApp({
      rawPhone: String(rawPhone),
      text: String(text),
      waId: msg?.id || body.id || body.waId || null,
      contactName: contact?.profile?.name || null,
      locale: body.locale,
      metaBody: body,
    });

    return NextResponse.json({
      ...result,
      businessNumber: "0713838638",
    });
  } catch (error) {
    console.error("[whatsapp:webhook]", error);
    // Always 200 to Meta so they don't disable the webhook for transient errors
    return NextResponse.json({ ok: false, error: "Webhook failed" }, { status: 200 });
  }
}

const sendSchema = z.object({
  phone: z.string().min(8),
  message: z.string().min(1).max(2000),
});

/** Staff outbound */
export async function PUT(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const phone = normalizeWhatsAppPhone(parsed.data.phone);
  const { sendWhatsAppRich } = await import("@/lib/support/whatsapp-rich");
  const delivery = await sendWhatsAppRich({
    phone,
    body: parsed.data.message,
    assigneeId: auth.user.id,
  });

  return NextResponse.json({
    message: delivery.message,
    delivery,
    businessNumber: "0713838638",
  });
}
