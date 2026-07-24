import { prisma } from "@/lib/db";
import { sendWhatsAppMessage, getWhatsAppGateway } from "@/lib/support/whatsapp-gateway";
import { normalizeWhatsAppPhone } from "@/lib/support/whatsapp-phone";
import { whatsappGraphUrl } from "@/lib/support/whatsapp-api";

export type WhatsAppProvider = "stub" | "meta" | "twilio";

export { getWhatsAppGateway, sendWhatsAppMessage };

/** Enhanced send with optional template + media logging */
export async function sendWhatsAppRich(opts: {
  phone: string;
  body: string;
  templateName?: string;
  mediaUrl?: string;
  mediaType?: "image" | "document" | "video";
  assigneeId?: string;
  conversationId?: string;
}) {
  const phone = normalizeWhatsAppPhone(opts.phone) || opts.phone.replace(/\D/g, "");
  const gw = await getWhatsAppGateway();

  let result: { ok: boolean; provider: string; data?: unknown; error?: unknown; stub?: boolean };

  if (gw.provider === "meta" && process.env.WHATSAPP_TOKEN && gw.config.phoneNumberId) {
    try {
      let payload: Record<string, unknown>;
      if (opts.templateName) {
        payload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: opts.templateName,
            language: { code: "en" },
          },
        };
      } else if (opts.mediaUrl && opts.mediaType === "image") {
        payload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "image",
          image: { link: opts.mediaUrl, caption: opts.body },
        };
      } else if (opts.mediaUrl && opts.mediaType === "document") {
        payload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "document",
          document: { link: opts.mediaUrl, caption: opts.body },
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: opts.body },
        };
      }

      const res = await fetch(whatsappGraphUrl(`${gw.config.phoneNumberId}/messages`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      result = { ok: res.ok, provider: "meta", data };
    } catch (error) {
      console.error("[whatsapp:meta:rich]", error);
      result = { ok: false, provider: "meta", error };
    }
  } else if (
    gw.provider === "twilio" &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    gw.config.fromNumber
  ) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN!;
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const params = new URLSearchParams({
        To: `whatsapp:+${phone}`,
        From: `whatsapp:${gw.config.fromNumber}`,
        Body: opts.body,
      });
      if (opts.mediaUrl) params.set("MediaUrl", opts.mediaUrl);
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params,
        }
      );
      const data = await res.json();
      result = { ok: res.ok, provider: "twilio", data };
    } catch (error) {
      console.error("[whatsapp:twilio]", error);
      result = { ok: false, provider: "twilio", error };
    }
  } else {
    result = await sendWhatsAppMessage({
      phone,
      body: opts.body,
      templateName: opts.templateName,
    });
  }

  let conversationId = opts.conversationId;
  if (!conversationId) {
    const conv = await prisma.whatsAppConversation.upsert({
      where: { phone },
      create: { phone, status: "OPEN", lastMessageAt: new Date() },
      update: { lastMessageAt: new Date() },
    });
    conversationId = conv.id;
  }

  // Response time: ms since last inbound message on this thread
  let responseMs: number | null = null;
  const lastIn = await prisma.whatsAppMessage.findFirst({
    where: { phone, direction: "IN" },
    orderBy: { createdAt: "desc" },
  });
  if (lastIn) {
    responseMs = Math.max(0, Date.now() - lastIn.createdAt.getTime());
  }

  const msg = await prisma.whatsAppMessage.create({
    data: {
      direction: "OUT",
      phone,
      body: opts.body,
      status: result.ok ? "SENT" : "FAILED",
      templateName: opts.templateName || null,
      mediaType: opts.mediaType || (opts.mediaUrl ? "document" : "text"),
      mediaUrl: opts.mediaUrl || null,
      conversationId,
      assigneeId: opts.assigneeId || null,
      responseMs,
      metaJson: JSON.stringify(result),
    },
  });

  return { ...result, message: msg, conversationId, responseMs };
}
