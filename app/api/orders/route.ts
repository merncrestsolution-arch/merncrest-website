import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMoney, nextNumber, requireUser } from "@/lib/commerce";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { z } from "zod";

const TAX_RATE = 0;

const checkoutSchema = z.object({
  couponCode: z.string().optional(),
  registrant: z
    .object({
      companyName: z.string().optional(),
      registrantName: z.string().min(2),
      nicOrBr: z.string().optional(),
      address: z.string().optional(),
      country: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      adminContact: z.string().optional(),
      techContact: z.string().optional(),
      billingContact: z.string().optional(),
    })
    .optional(),
  acceptTerms: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const orders = await prisma.order.findMany({
      where: { userId: auth.user.id },
      include: { items: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[orders:get]", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

/** Checkout: cart → order + invoice (optional coupon + registrant) */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });
    }

    if (parsed.data.acceptTerms === false) {
      return NextResponse.json({ error: "Please accept terms to continue" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subtotalCents = cart.items.reduce(
      (sum, i) => sum + i.product.priceCents * i.quantity,
      0
    );

    let discountCents = 0;
    let couponCode: string | null = null;

    if (parsed.data.couponCode?.trim()) {
      const code = parsed.data.couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
      }
      if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }
      if (subtotalCents < coupon.minOrderCents) {
        return NextResponse.json({ error: "Order below coupon minimum" }, { status: 400 });
      }
      discountCents =
        coupon.type === "PERCENT"
          ? Math.round((subtotalCents * coupon.value) / 100)
          : Math.min(coupon.value, subtotalCents);
      couponCode = code;
    }

    const taxCents = Math.round((subtotalCents - discountCents) * TAX_RATE);
    const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);

    const registrant = parsed.data.registrant
      ? {
          ...parsed.data.registrant,
          email: parsed.data.registrant.email || auth.user.email,
          registrantName: parsed.data.registrant.registrantName || auth.user.fullName,
          companyName: parsed.data.registrant.companyName || auth.user.company || undefined,
        }
      : {
          registrantName: auth.user.fullName,
          email: auth.user.email,
          companyName: auth.user.company || undefined,
          country: "Sri Lanka",
        };

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: nextNumber("ORD"),
          userId: auth.user.id,
          status: "PENDING",
          subtotalCents,
          taxCents,
          discountCents,
          totalCents,
          currency: "LKR",
          couponCode,
          registrantJson: JSON.stringify(registrant),
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              productName: i.product.name,
              productSlug: i.product.slug,
              quantity: i.quantity,
              unitPriceCents: i.product.priceCents,
              totalCents: i.product.priceCents * i.quantity,
              billingPeriod: i.product.billingPeriod,
              metaJson: i.metaJson,
            })),
          },
        },
        include: { items: true },
      });

      await tx.invoice.create({
        data: {
          invoiceNumber: nextNumber("INV"),
          orderId: created.id,
          userId: auth.user.id,
          status: "SENT",
          subtotalCents,
          taxCents,
          totalCents,
          currency: "LKR",
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true, invoice: true },
      });
    });

    if (order.invoice) {
      void sendOrderConfirmationEmail({
        to: auth.user.email,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoice.invoiceNumber,
        totalLabel: formatMoney(order.totalCents),
        items: order.items.map((i) => `${i.productName} ×${i.quantity}`),
      });
    }

    return NextResponse.json(
      {
        order,
        message: `Order ${order.orderNumber} created (${formatMoney(order.totalCents)})`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[orders:post]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
