import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatMoney, nextNumber, requireUser } from "@/lib/commerce";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { onCustomerOrderCreated } from "@/lib/crm/customer-hooks";
import { notifyUser } from "@/lib/support/notify";
import { cartItemUnitPriceCents, cartSubtotalCents } from "@/lib/commerce/cart-price";
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

    const subtotalCents = cartSubtotalCents(cart.items);

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
            create: cart.items.map((i) => {
              const unit = cartItemUnitPriceCents(i);
              const name = i.lineLabel || i.product.marketingTitle || i.product.name;
              return {
                productId: i.productId,
                productName: name,
                productSlug: i.product.slug,
                quantity: i.quantity,
                unitPriceCents: unit,
                totalCents: unit * i.quantity,
                providerCostCents: i.product.providerPriceCents ?? null,
                providerCurrency: i.providerCurrency ?? i.product.currency ?? "LKR",
                exchangeRate: i.exchangeRate ?? null,
                exchangeRateLockedAt: i.exchangeRateLockedAt ?? null,
                fxBufferPercent: i.fxBufferPercent ?? null,
                billingPeriod: i.product.billingPeriod,
                metaJson: i.metaJson,
              };
            }),
          },
        },
        include: { items: true },
      });

      const invoice = await tx.invoice.create({
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

      // Mark linked quotations as ACCEPTED + ensure delivery project after client confirms
      for (const item of cart.items) {
        if (!item.metaJson) continue;
        try {
          const meta = JSON.parse(item.metaJson) as {
            salesProject?: boolean;
            quotationId?: string;
            leadId?: string;
            projectName?: string;
            advanceCents?: number;
            balanceCents?: number;
            balanceDueAt?: string;
            erpProjectId?: string;
          };
          if (meta.salesProject && meta.quotationId) {
            await tx.quotation.update({
              where: { id: meta.quotationId },
              data: { status: "ACCEPTED", orderId: created.id },
            });
          }
          if (meta.salesProject && meta.leadId) {
            await tx.crmLead.update({
              where: { id: meta.leadId },
              data: { stage: "NEGOTIATION" },
            });
            await tx.crmActivity.create({
              data: {
                leadId: meta.leadId,
                userId: auth.user.id,
                type: "STATUS",
                body: `Customer checked out Sales project terms · Order ${created.orderNumber}`,
              },
            });
          }

          if (meta.salesProject) {
            const lineTotal =
              cartItemUnitPriceCents(item) * item.quantity;
            let erpId = meta.erpProjectId;
            if (!erpId) {
              const prj = await tx.erpProject.create({
                data: {
                  projectCode: nextNumber("PRJ"),
                  name: meta.projectName || item.lineLabel || item.product.name,
                  status: "ACTIVE",
                  customerId: auth.user.id,
                  revenueCents: lineTotal,
                  members: {
                    create: { userId: auth.user.id, role: "VIEWER" },
                  },
                },
              });
              erpId = prj.id;
            } else {
              await tx.erpProject.update({
                where: { id: erpId },
                data: {
                  customerId: auth.user.id,
                  status: "ACTIVE",
                  revenueCents: { increment: lineTotal },
                },
              });
              await tx.projectMember.upsert({
                where: {
                  projectId_userId: { projectId: erpId, userId: auth.user.id },
                },
                create: { projectId: erpId, userId: auth.user.id, role: "VIEWER" },
                update: {},
              });
            }

            const advance = meta.advanceCents ?? lineTotal;
            const balance = meta.balanceCents ?? 0;
            await tx.projectPaymentSchedule.create({
              data: {
                projectId: erpId,
                label: "Order confirmation / advance",
                amountCents: advance,
                dueDate: new Date(),
                status: "INVOICED",
                invoiceId: invoice.id,
                notes: `From order ${created.orderNumber}`,
              },
            });
            if (balance > 0) {
              await tx.projectPaymentSchedule.create({
                data: {
                  projectId: erpId,
                  label: "Balance payment",
                  amountCents: balance,
                  dueDate: meta.balanceDueAt
                    ? new Date(meta.balanceDueAt)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  status: "PENDING",
                  notes: `Balance for order ${created.orderNumber}`,
                },
              });
            }
            const nextBal = await tx.projectPaymentSchedule.findFirst({
              where: {
                projectId: erpId,
                status: { in: ["PENDING", "INVOICED", "OVERDUE"] },
              },
              orderBy: { dueDate: "asc" },
            });
            await tx.erpProject.update({
              where: { id: erpId },
              data: {
                nextPaymentAt: nextBal?.dueDate || null,
                nextPaymentCents: nextBal?.amountCents || 0,
              },
            });
          }
        } catch {
          /* ignore bad meta */
        }
      }

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

    const itemSummary = order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ");

    if (order.invoice) {
      void sendOrderConfirmationEmail({
        to: auth.user.email,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoice.invoiceNumber,
        totalLabel: formatMoney(order.totalCents),
        items: order.items.map((i) => `${i.productName} ×${i.quantity}`),
      });
      void import("@/lib/notify/client-email").then(({ notifyClient }) =>
        notifyClient("ORDER_CONFIRMED", {
          toEmail: auth.user.email,
          vars: {
            name: auth.user.fullName,
            orderNumber: order.orderNumber,
          },
        })
      );
    }

    void onCustomerOrderCreated({
      userId: auth.user.id,
      email: auth.user.email,
      fullName: auth.user.fullName,
      company: auth.user.company,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      itemSummary,
    });
    void notifyUser({
      userId: auth.user.id,
      title: `Order ${order.orderNumber} confirmed`,
      body: `Invoice ${order.invoice?.invoiceNumber || ""} · Total ${formatMoney(order.totalCents)}. Pay from Billing.`,
      category: "ORDER",
      href: `/portal/orders/confirmed?order=${order.orderNumber}`,
    });
    const { notifyOrderWhatsApp } = await import("@/lib/crm/whatsapp-notify");
    void notifyOrderWhatsApp({
      userId: auth.user.id,
      orderNumber: order.orderNumber,
      trackingUrl: "/en/portal/orders",
    });

    return NextResponse.json(
      {
        order,
        invoice: order.invoice,
        orderNumber: order.orderNumber,
        invoiceNumber: order.invoice?.invoiceNumber,
        message: `Order ${order.orderNumber} created with invoice ${order.invoice?.invoiceNumber}`,
        redirectTo: `/portal/orders/confirmed?order=${encodeURIComponent(order.orderNumber)}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[orders:post]", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
