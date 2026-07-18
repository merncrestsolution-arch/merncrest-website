import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(2),
  subtotalCents: z.number().int().min(0),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const code = parsed.data.code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 404 });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (parsed.data.subtotalCents < coupon.minOrderCents) {
      return NextResponse.json({ error: "Order below coupon minimum" }, { status: 400 });
    }

    const discountCents =
      coupon.type === "PERCENT"
        ? Math.round((parsed.data.subtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, parsed.data.subtotalCents);

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountCents,
    });
  } catch (error) {
    console.error("[coupons]", error);
    return NextResponse.json({ error: "Coupon check failed" }, { status: 500 });
  }
}
