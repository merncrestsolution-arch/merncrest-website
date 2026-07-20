import { prisma } from "@/lib/db";

export const DEFAULT_SETTINGS: {
  key: string;
  value: string;
  valueType: string;
  group: string;
  label: string;
  description?: string;
}[] = [
  {
    key: "company.name",
    value: "MernCrest Solutions (Pvt) Ltd",
    valueType: "STRING",
    group: "company",
    label: "Company name",
  },
  {
    key: "company.email",
    value: "hello@merncrest.lk",
    valueType: "STRING",
    group: "company",
    label: "Public email",
  },
  {
    key: "company.phone",
    value: "+94",
    valueType: "STRING",
    group: "company",
    label: "Phone",
  },
  {
    key: "company.address",
    value: "Colombo, Sri Lanka",
    valueType: "STRING",
    group: "company",
    label: "Address",
  },
  {
    key: "company.timezone",
    value: "Asia/Colombo",
    valueType: "STRING",
    group: "regional",
    label: "Timezone",
  },
  {
    key: "company.currency",
    value: "LKR",
    valueType: "STRING",
    group: "regional",
    label: "Default currency",
  },
  {
    key: "company.taxRatePercent",
    value: "0",
    valueType: "NUMBER",
    group: "regional",
    label: "Default tax %",
  },
  {
    key: "branding.tagline",
    value: "Enterprise AI Digital Platform",
    valueType: "STRING",
    group: "branding",
    label: "Tagline",
  },
  {
    key: "branding.primaryColor",
    value: "#7C3AED",
    valueType: "STRING",
    group: "branding",
    label: "Primary color",
  },
  {
    key: "security.sessionDays",
    value: "14",
    valueType: "NUMBER",
    group: "security",
    label: "Session length (days)",
  },
  {
    key: "security.maxLoginAttempts",
    value: "5",
    valueType: "NUMBER",
    group: "security",
    label: "Max login attempts",
  },
  {
    key: "security.passwordMinLength",
    value: "8",
    valueType: "NUMBER",
    group: "security",
    label: "Min password length",
  },
  {
    key: "security.require2fa",
    value: "false",
    valueType: "BOOLEAN",
    group: "security",
    label: "Require 2FA (planned)",
  },
  {
    key: "email.fromName",
    value: "MernCrest",
    valueType: "STRING",
    group: "email",
    label: "From name",
  },
  {
    key: "email.fromAddress",
    value: "noreply@merncrest.lk",
    valueType: "STRING",
    group: "email",
    label: "From address",
  },
  {
    key: "email.replyTo",
    value: "hello@merncrest.lk",
    valueType: "STRING",
    group: "email",
    label: "Reply-to",
  },
  {
    key: "maintenance.enabled",
    value: "false",
    valueType: "BOOLEAN",
    group: "maintenance",
    label: "Maintenance mode",
  },
  {
    key: "maintenance.message",
    value: "MernCrest is undergoing scheduled maintenance. Please check back shortly.",
    valueType: "STRING",
    group: "maintenance",
    label: "Maintenance message",
  },
  {
    key: "localization.defaultLocale",
    value: "en",
    valueType: "STRING",
    group: "localization",
    label: "Default locale",
  },
  {
    key: "localization.enabledLocales",
    value: '["en","ta","si"]',
    valueType: "JSON",
    group: "localization",
    label: "Enabled locales",
  },
  {
    key: "storage.provider",
    value: "local",
    valueType: "STRING",
    group: "storage",
    label: "Storage provider",
    description: "local | s3 (AWS ready)",
  },
  {
    key: "fx.usdLkrRate",
    value: "320",
    valueType: "NUMBER",
    group: "regional",
    label: "USD → LKR exchange rate",
    description: "Locked at quote time for USD-denominated provider products",
  },
  {
    key: "fx.defaultBufferPercent",
    value: "2",
    valueType: "NUMBER",
    group: "regional",
    label: "Default FX buffer %",
    description: "Absorbs rate movement between quote and purchase",
  },
];

export async function ensureDefaultSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettingBool(key: string, fallback = false): Promise<boolean> {
  const v = await getSetting(key);
  if (v == null) return fallback;
  return v === "true" || v === "1";
}

export async function setSetting(
  key: string,
  value: string,
  updatedById?: string | null
) {
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (existing) {
    return prisma.systemSetting.update({
      where: { key },
      data: { value, updatedById: updatedById || null },
    });
  }
  const def = DEFAULT_SETTINGS.find((d) => d.key === key);
  return prisma.systemSetting.create({
    data: {
      key,
      value,
      valueType: def?.valueType ?? "STRING",
      group: def?.group ?? "general",
      label: def?.label,
      description: def?.description,
      updatedById: updatedById || null,
    },
  });
}

export async function getSettingsByGroup(group?: string) {
  await ensureDefaultSettings();
  return prisma.systemSetting.findMany({
    where: group ? { group } : undefined,
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });
}

export async function isMaintenanceMode() {
  return getSettingBool("maintenance.enabled", false);
}

export async function getMaintenanceMessage() {
  return (
    (await getSetting("maintenance.message")) ||
    "MernCrest is undergoing scheduled maintenance."
  );
}
