import { prisma } from "@/lib/db";
import { normalizeWhatsAppPhone } from "@/lib/support/whatsapp-phone";
import { whatsappGraphUrl } from "@/lib/support/whatsapp-api";

export type WhatsAppProvider = "stub" | "meta" | "twilio";

export async function getWhatsAppGateway() {
  const row = await prisma.systemGatewayConfig.findUnique({
    where: { provider: "WHATSAPP" },
  });
  if (!row?.active) {
    return {
      provider: "stub" as WhatsAppProvider,
      config: {
        businessNumber: "0713838638",
        businessNumberE164: "94713838638",
        fromNumber: "+94713838638",
      } as Record<string, string>,
      active: false,
    };
  }
  let config: Record<string, string> = {};
  try {
    config = row.configJson ? JSON.parse(row.configJson) : {};
  } catch {
    config = {};
  }
  if (process.env.WHATSAPP_PHONE_NUMBER_ID && !config.phoneNumberId) {
    config.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }
  const provider = (config.provider as WhatsAppProvider) || "meta";
  return { provider, config, active: row.active };
}

/**
 * Outbound WhatsApp send — Meta Cloud API (version from WHATSAPP_API_VERSION).
 * Business from-number: 0713838638 (+94713838638).
 */
export async function sendWhatsAppMessage(opts: {
  phone: string;
  body: string;
  templateName?: string;
}) {
  const gw = await getWhatsAppGateway();
  const phone = normalizeWhatsAppPhone(opts.phone);
  const from =
    gw.config.fromNumber ||
    gw.config.businessNumberE164 ||
    process.env.WHATSAPP_BUSINESS_NUMBER_E164 ||
    "94713838638";

  if (gw.provider === "meta" && process.env.WHATSAPP_TOKEN && gw.config.phoneNumberId) {
    try {
      const res = await fetch(whatsappGraphUrl(`${gw.config.phoneNumberId}/messages`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: opts.body },
        }),
      });
      const data = await res.json();
      return { ok: res.ok, provider: "meta" as const, data, from };
    } catch (error) {
      console.error("[whatsapp:meta]", error);
      return { ok: false, provider: "meta" as const, error, from };
    }
  }

  if (gw.provider === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN!;
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const twilioFrom = gw.config.fromNumber?.startsWith("whatsapp:")
        ? gw.config.fromNumber
        : `whatsapp:${gw.config.fromNumber || "+94713838638"}`;
      const params = new URLSearchParams({
        To: `whatsapp:+${phone}`,
        From: twilioFrom,
        Body: opts.body,
      });
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
      return { ok: res.ok, provider: "twilio" as const, data, from };
    } catch (error) {
      console.error("[whatsapp:twilio]", error);
      return { ok: false, provider: "twilio" as const, error, from };
    }
  }

  console.info(
    `[whatsapp:stub] from=${from} to=+${phone} tpl=${opts.templateName || "-"} :: ${opts.body.slice(0, 120)}`
  );
  return {
    ok: true,
    provider: "stub" as const,
    stub: true,
    from,
    to: phone,
  };
}

/** Apply first matching RoutingRule for inbound channel */
export async function applyInboundRouting(opts: {
  source: "WHATSAPP" | "EMAIL" | "IVR" | "FORM" | "PORTAL" | "TICKET";
  departmentHint?: string;
}) {
  const rules = await prisma.routingRule.findMany({
    where: { active: true, source: opts.source },
    orderBy: { priority: "asc" },
    take: 20,
  });
  const rule = rules[0];
  if (!rule) {
    return {
      department: opts.departmentHint || "GENERAL",
      assigneeId: null as string | null,
      targetType: "TICKET" as const,
    };
  }
  return {
    department: rule.department || opts.departmentHint || "GENERAL",
    assigneeId: rule.assigneeId,
    targetType: (rule.targetType as "LEAD" | "TICKET") || "TICKET",
  };
}
