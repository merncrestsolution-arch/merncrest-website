import { prisma } from "@/lib/db";
import { getWhatsAppGateway } from "@/lib/support/whatsapp-gateway";
import {
  MERNcrest_WA_DISPLAY,
  MERNcrest_WA_E164,
} from "@/lib/support/whatsapp-phone";

export function whatsappApiVersion() {
  return process.env.WHATSAPP_API_VERSION || "v23.0";
}

export function whatsappGraphUrl(path: string) {
  const clean = path.replace(/^\//, "");
  return `https://graph.facebook.com/${whatsappApiVersion()}/${clean}`;
}

export type WhatsAppConnectionStatus = {
  connected: boolean;
  phoneNumberVerified: boolean;
  webhookActive: boolean;
  automationEnabled: boolean;
  templatesSynced: boolean;
  qualityRating: string | null;
  businessNumber: string;
  businessNumberE164: string;
  provider: string;
  apiVersion: string;
  metaReady: boolean;
  checklist: { id: string; label: string; ok: boolean }[];
  counts: {
    templates: number;
    templatesApproved: number;
    automationsActive: number;
    conversations: number;
    messages24h: number;
    drips: number;
  };
  lastInboundAt: string | null;
  clickToChat: string;
  webhookUrlHint: string;
};

/** CRM Settings → WhatsApp → Meta Cloud API status */
export async function getWhatsAppConnectionStatus(): Promise<WhatsAppConnectionStatus> {
  const gw = await getWhatsAppGateway();
  const token = Boolean(process.env.WHATSAPP_TOKEN);
  const phoneId = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID || gw.config.phoneNumberId
  );
  const waba = Boolean(process.env.WHATSAPP_WABA_ID || gw.config.wabaId);
  void waba;
  const metaReady = token && phoneId;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    templates,
    templatesApproved,
    automationsActive,
    conversations,
    messages24h,
    lastIn,
    dripActive,
  ] = await Promise.all([
    prisma.whatsAppTemplate.count({ where: { active: true } }),
    prisma.whatsAppTemplate.count({ where: { status: "APPROVED", active: true } }),
    prisma.whatsAppAutomation.count({ where: { active: true } }),
    prisma.whatsAppConversation.count(),
    prisma.whatsAppMessage.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.whatsAppMessage.findFirst({
      where: { direction: "IN" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.paymentDripSequence.count({ where: { active: true } }),
  ]);

  let qualityRating: string | null = null;
  const rated = await prisma.whatsAppConversation.aggregate({
    _avg: { qualityAvg: true },
    where: { qualityAvg: { not: null } },
  });
  if (rated._avg.qualityAvg != null) {
    const q = rated._avg.qualityAvg;
    qualityRating = q >= 4 ? "GREEN" : q >= 3 ? "YELLOW" : "RED";
  }

  const fullAuto = String(
    (gw.config as Record<string, unknown>).fullAutomation ?? true
  );
  const automationEnabled =
    Boolean(gw.active) && automationsActive > 0 && fullAuto !== "false";
  const webhookActive = Boolean(lastIn) || metaReady; // live once Meta is wired or traffic seen
  const phoneNumberVerified = Boolean(
    gw.config.businessNumberE164 || MERNcrest_WA_E164
  );
  const templatesSynced = templates > 0 && (templatesApproved > 0 || !metaReady);

  const checklist = [
    { id: "connected", label: "Connected", ok: metaReady || Boolean(gw.active) },
    { id: "phone", label: "Phone Number Verified", ok: phoneNumberVerified },
    { id: "webhook", label: "Webhook Active", ok: webhookActive },
    { id: "automation", label: "Automation Enabled", ok: automationEnabled },
    { id: "templates", label: "Templates Synced", ok: templatesSynced },
    {
      id: "quality",
      label: "Quality Rating",
      ok: qualityRating !== "RED",
    },
  ];

  return {
    connected: metaReady || Boolean(gw.active),
    phoneNumberVerified,
    webhookActive,
    automationEnabled,
    templatesSynced,
    qualityRating,
    businessNumber: String(gw.config.businessNumber || MERNcrest_WA_DISPLAY),
    businessNumberE164: String(gw.config.businessNumberE164 || MERNcrest_WA_E164),
    provider: metaReady ? "meta" : String(gw.config.provider || "stub"),
    apiVersion: whatsappApiVersion(),
    metaReady,
    checklist,
    counts: {
      templates,
      templatesApproved,
      automationsActive,
      conversations,
      messages24h,
      drips: dripActive,
    },
    lastInboundAt: lastIn?.createdAt?.toISOString() || null,
    clickToChat: `https://wa.me/${gw.config.businessNumberE164 || MERNcrest_WA_E164}`,
    webhookUrlHint: "/api/whatsapp",
  };
}
