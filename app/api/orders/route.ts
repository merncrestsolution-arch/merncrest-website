import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMoney, nextNumber, requireUser } from "@/lib/commerce";

const TAX_RATE = 0; // extend later for VAT

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

/** Checkout: convert cart → order + invoice */
export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
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
    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const totalCents = subtotalCents + taxCents;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: nextNumber("ORD"),
          userId: auth.user.id,
          status: "PENDING",
          subtotalCents,
          taxCents,
          totalCents,
          currency: "LKR",
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              productName: i.product.name,
              productSlug: i.product.slug,
              quantity: i.quantity,
              unitPriceCents: i.product.priceCents,
              totalCents: i.product.priceCents * i.quantity,
              billingPeriod: i.product.billingPeriod,
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

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true, invoice: true },
      });
    });

    return NextResponse.json({
      order,
      message: `Order ${order.orderNumber} created (${formatMoney(order.totalCents)})`,
    }, { status: 201 });
  } catch (error) {
    console.error("[orders:post]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
