import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { ensureDefaultMargins, DEFAULT_MARGINS } from "@/lib/providers/pricing-engine";
import { getUsdLkrRate, getDefaultFxBufferPercent } from "@/lib/providers/fx";
import { setSetting } from "@/lib/admin/settings";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

const updateSchema = z.object({
  category: z.enum(["domains", "hosting", "vps", "ssl", "email", "cloud"]),
  marginCents: z.number().int().min(0),
  marginPercent: z.number().min(0).max(100).optional(),
  /** FIXED | PERCENT | BOTH — does not rewrite other categories' stored values */
  marginMode: z.enum(["FIXED", "PERCENT", "BOTH"]).optional(),
  fxBufferPercent: z.number().min(0).max(20).optional(),
});

const fxSchema = z.object({
  usdLkrRate: z.number().positive().optional(),
  defaultFxBufferPercent: z.number().min(0).max(20).optional(),
});

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  await ensureDefaultMargins();
  const margins = await prisma.pricingMargin.findMany({ orderBy: { category: "asc" } });
  const usdLkrRate = await getUsdLkrRate();
  const defaultFxBufferPercent = await getDefaultFxBufferPercent();

  return NextResponse.json({
    margins,
    fx: { usdLkrRate, defaultFxBufferPercent },
    formula:
      "Selling (LKR) = FX(Provider USD→LKR + buffer) + Margin (FIXED cents and/or PERCENT)",
    defaults: DEFAULT_MARGINS,
    migrationNote:
      "Existing marginCents/marginPercent/marginMode are preserved. Switching to PERCENT does not alter stored numbers — only how they are applied. New USD-priced quotes prefer PERCENT when a percent value exists.",
  });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();

  // FX rate / global buffer update
  if (body.usdLkrRate != null || body.defaultFxBufferPercent != null) {
    const fxParsed = fxSchema.safeParse(body);
    if (!fxParsed.success) {
      return NextResponse.json({ error: "Invalid FX settings" }, { status: 400 });
    }
    if (fxParsed.data.usdLkrRate != null) {
      await setSetting("fx.usdLkrRate", String(fxParsed.data.usdLkrRate), auth.user.id);
    }
    if (fxParsed.data.defaultFxBufferPercent != null) {
      await setSetting(
        "fx.defaultBufferPercent",
        String(fxParsed.data.defaultFxBufferPercent),
        auth.user.id
      );
    }
    void writeAuditLog({
      actorId: auth.user.id,
      action: "pricing.fx_update",
      module: "marketplace",
      entityType: "SystemSetting",
      summary: "Updated FX rate / buffer",
      meta: fxParsed.data,
    });
    return NextResponse.json({
      fx: {
        usdLkrRate: await getUsdLkrRate(),
        defaultFxBufferPercent: await getDefaultFxBufferPercent(),
      },
    });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid margin" }, { status: 400 });
  }

  const margin = await prisma.pricingMargin.upsert({
    where: { category: parsed.data.category },
    create: {
      category: parsed.data.category,
      marginCents: parsed.data.marginCents,
      marginPercent: parsed.data.marginPercent ?? 0,
      marginMode: parsed.data.marginMode ?? "FIXED",
      fxBufferPercent: parsed.data.fxBufferPercent ?? 2,
    },
    update: {
      marginCents: parsed.data.marginCents,
      ...(parsed.data.marginPercent != null
        ? { marginPercent: parsed.data.marginPercent }
        : {}),
      ...(parsed.data.marginMode != null ? { marginMode: parsed.data.marginMode } : {}),
      ...(parsed.data.fxBufferPercent != null
        ? { fxBufferPercent: parsed.data.fxBufferPercent }
        : {}),
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    action: "pricing.margin_update",
    module: "marketplace",
    entityType: "PricingMargin",
    entityId: margin.id,
    summary: `Margin updated for ${margin.category}`,
    meta: {
      marginCents: margin.marginCents,
      marginPercent: margin.marginPercent,
      marginMode: margin.marginMode,
      fxBufferPercent: margin.fxBufferPercent,
    },
  });

  return NextResponse.json({ margin });
}
