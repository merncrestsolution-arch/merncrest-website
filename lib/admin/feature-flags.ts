import { prisma } from "@/lib/db";

export const DEFAULT_FLAGS: {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: string;
}[] = [
  {
    key: "payment.gateway",
    name: "Online payment gateway",
    description: "Enable PayHere / card gateways (also gated by env)",
    enabled: false,
    tier: "STABLE",
  },
  {
    key: "whatsapp.live",
    name: "Live WhatsApp Meta API",
    description: "Use live Meta Cloud API instead of mock",
    enabled: false,
    tier: "BETA",
  },
  {
    key: "ai.assistant",
    name: "AI assistants",
    description: "Enable AI report/summarize features in admin & ERP",
    enabled: true,
    tier: "STABLE",
  },
  {
    key: "cms.public",
    name: "CMS-driven public pages",
    description: "Serve published CMS content on marketing pages",
    enabled: false,
    tier: "BETA",
  },
  {
    key: "experimental.kanban_ai",
    name: "CRM AI scoring",
    description: "Experimental lead scoring enhancements",
    enabled: false,
    tier: "EXPERIMENTAL",
  },
  {
    key: "portal.announcements",
    name: "Portal announcements",
    description: "Show announcement feed in customer portal",
    enabled: true,
    tier: "STABLE",
  },
];

export async function ensureDefaultFlags() {
  for (const f of DEFAULT_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    });
  }
}

export async function isFeatureEnabled(key: string, fallback = false) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) return fallback;
  return flag.enabled;
}
