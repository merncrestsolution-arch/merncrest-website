import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { lockFxQuote } from "@/lib/providers/fx";
import { z } from "zod";

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: { include: { product: true }, orderBy: { id: "asc" } },
    },
  });
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const cart = await getOrCreateCart(auth.user.id);
    const subtotalCents = cart.items.reduce(
      (sum, i) => sum + i.product.priceCents * i.quantity,
      0
    );
    return NextResponse.json({ cart, subtotalCents });
  } catch (error) {
    console.error("[cart:get]", error);
    return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
  }
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).optional(),
  meta: z.record(z.string(), z.string()).optional(),
  providerCurrency: z.string().optional(),
  exchangeRate: z.number().positive().optional(),
  fxBufferPercent: z.number().min(0).max(20).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, active: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const cart = await getOrCreateCart(auth.user.id);
    const qty = parsed.data.quantity ?? 1;
    const metaJson = parsed.data.meta ? JSON.stringify(parsed.data.meta) : null;

    const currency = parsed.data.providerCurrency || product.currency || "LKR";
    let fxFields: {
      providerCurrency: string;
      exchangeRate: number;
      exchangeRateLockedAt: Date;
      fxBufferPercent: number;
    };

    if (parsed.data.exchangeRate && parsed.data.providerCurrency) {
      fxFields = {
        providerCurrency: parsed.data.providerCurrency.toUpperCase(),
        exchangeRate: parsed.data.exchangeRate,
        exchangeRateLockedAt: new Date(),
        fxBufferPercent: parsed.data.fxBufferPercent ?? 2,
      };
    } else {
      const quote = await lockFxQuote(
        product.providerPriceCents ?? product.priceCents,
        currency,
        parsed.data.fxBufferPercent
      );
      fxFields = {
        providerCurrency: quote.providerCurrency,
        exchangeRate: quote.exchangeRate,
        exchangeRateLockedAt: quote.exchangeRateLockedAt,
        fxBufferPercent: quote.fxBufferPercent,
      };
    }

    if (metaJson) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: qty,
          metaJson,
          ...fxFields,
        },
      });
    } else {
      const existing = cart.items.find((i) => i.productId === product.id && !i.metaJson);
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: qty } },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            quantity: qty,
            ...fxFields,
          },
        });
      }
    }

    const updated = await getOrCreateCart(auth.user.id);
    const subtotalCents = updated.items.reduce(
      (sum, i) => sum + i.product.priceCents * i.quantity,
      0
    );
    return NextResponse.json({ cart: updated, subtotalCents });
  } catch (error) {
    console.error("[cart:post]", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

const patchSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const cart = await getOrCreateCart(auth.user.id);
    const item = cart.items.find((i) => i.id === parsed.data.itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: parsed.data.quantity },
      });
    }

    const updated = await getOrCreateCart(auth.user.id);
    const subtotalCents = updated.items.reduce(
      (sum, i) => sum + i.product.priceCents * i.quantity,
      0
    );
    return NextResponse.json({ cart: updated, subtotalCents });
  } catch (error) {
    console.error("[cart:patch]", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
