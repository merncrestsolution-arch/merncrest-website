import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

export async function vatRatePercent(): Promise<number> {
  const orgId = await getPrimaryOrganizationId();
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "vat_rate_percent" },
  }).catch(() => null);
  if (setting?.value) {
    const n = Number(setting.value);
    if (!Number.isNaN(n)) return n;
  }
  void orgId;
  return Number(process.env.VAT_RATE_PERCENT || 18);
}
