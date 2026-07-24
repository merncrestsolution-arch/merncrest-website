import { prisma } from "@/lib/db";
import { getWhatsAppGateway } from "@/lib/support/whatsapp-gateway";
import { whatsappGraphUrl } from "@/lib/support/whatsapp-api";

type MetaTemplate = {
  name: string;
  status?: string;
  category?: string;
  language?: string;
  components?: { type: string; text?: string; format?: string }[];
};

/**
 * Pull message templates from Meta WhatsApp Business Account and upsert locally.
 * Requires WHATSAPP_TOKEN + WABA id (env WHATSAPP_WABA_ID or gateway config.wabaId).
 */
export async function syncMetaWhatsAppTemplates(): Promise<{
  ok: boolean;
  synced: number;
  skipped: number;
  error?: string;
  templates?: { name: string; status: string }[];
}> {
  const gw = await getWhatsAppGateway();
  const token = process.env.WHATSAPP_TOKEN;
  const wabaId =
    process.env.WHATSAPP_WABA_ID ||
    gw.config.wabaId ||
    gw.config.businessAccountId ||
    "";

  if (!token || !wabaId) {
    // Local stub sync — mark any LOCAL as PENDING so UI shows approval workflow
    const local = await prisma.whatsAppTemplate.findMany({ where: { status: "LOCAL" } });
    for (const t of local) {
      await prisma.whatsAppTemplate.update({
        where: { id: t.id },
        data: { status: "PENDING", providerKey: t.providerKey || t.name },
      });
    }
    return {
      ok: true,
      synced: local.length,
      skipped: 0,
      error: token && wabaId ? undefined : "No Meta credentials — marked LOCAL templates as PENDING (stub sync)",
      templates: local.map((t) => ({ name: t.name, status: "PENDING" })),
    };
  }

  try {
    const url = whatsappGraphUrl(
      `${wabaId}/message_templates?limit=100&fields=name,status,category,language,components`
    );
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as { data?: MetaTemplate[]; error?: { message: string } };
    if (!res.ok) {
      return {
        ok: false,
        synced: 0,
        skipped: 0,
        error: data.error?.message || `Meta API ${res.status}`,
      };
    }

    const list = data.data || [];
    let synced = 0;
    let skipped = 0;
    const out: { name: string; status: string }[] = [];

    for (const tpl of list) {
      if (!tpl.name) {
        skipped++;
        continue;
      }
      const bodyComp = (tpl.components || []).find((c) => c.type === "BODY");
      const body = bodyComp?.text || `[Meta template ${tpl.name}]`;
      const statusMap: Record<string, string> = {
        APPROVED: "APPROVED",
        PENDING: "PENDING",
        REJECTED: "REJECTED",
        PAUSED: "PENDING",
        DISABLED: "REJECTED",
      };
      const status = statusMap[(tpl.status || "").toUpperCase()] || "PENDING";
      const locale = (tpl.language || "en").toUpperCase().startsWith("TA")
        ? "TA"
        : (tpl.language || "").toUpperCase().startsWith("SI")
          ? "SI"
          : "EN";

      await prisma.whatsAppTemplate.upsert({
        where: { name: tpl.name },
        create: {
          name: tpl.name,
          providerKey: tpl.name,
          category: tpl.category || "UTILITY",
          locale,
          body,
          status,
          active: status === "APPROVED",
        },
        update: {
          providerKey: tpl.name,
          category: tpl.category || "UTILITY",
          locale,
          body,
          status,
          active: status === "APPROVED" || status === "LOCAL",
        },
      });
      synced++;
      out.push({ name: tpl.name, status });
    }

    return { ok: true, synced, skipped, templates: out };
  } catch (error) {
    console.error("[whatsapp:template-sync]", error);
    return {
      ok: false,
      synced: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
