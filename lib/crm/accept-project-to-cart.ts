import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { notifyUser } from "@/lib/support/notify";
import { logCustomerActivity } from "@/lib/crm/customer-hooks";
import { writeAuditLog } from "@/lib/erp/audit";
import { CUSTOM_PROJECT_PRODUCT_SLUG } from "@/lib/commerce/cart-price";

export type ProjectChargeMode = "ADVANCE" | "FULL" | "CUSTOM";

/**
 * Sales accepts a portal/CRM project request:
 * - Sales sets total + advance / charge amount
 * - Line is pushed to the customer's cart
 * - Quotation record + lead stage updated
 * Customer then checks out and pays from Cart → Billing.
 */
export async function acceptProjectToCart(opts: {
  leadId: string;
  actorId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  /** Project / service total in LKR cents (Sales decision) */
  projectTotalCents: number;
  /** ADVANCE | FULL | CUSTOM — Sales decides what goes to cart now */
  chargeMode: ProjectChargeMode;
  /** Required when chargeMode = ADVANCE (1–100) */
  advancePercent?: number;
  /** Required when chargeMode = CUSTOM — exact cart charge in cents */
  chargeCents?: number;
  /** Line description shown in cart */
  description: string;
  terms?: string;
  notes?: string;
}) {
  if (opts.projectTotalCents < 100) {
    throw new Error("Project total must be at least LKR 1.00");
  }

  const lead = await prisma.crmLead.findUnique({ where: { id: opts.leadId } });
  if (!lead) throw new Error("Lead not found");

  const customer = await prisma.user.findFirst({
    where: { email: lead.email.toLowerCase() },
  });
  if (!customer) {
    throw new Error(
      "No portal account for this lead email. Ask the customer to register, or update the lead email."
    );
  }

  let chargeCents = 0;
  let advancePercent: number | null = null;

  if (opts.chargeMode === "FULL") {
    chargeCents = opts.projectTotalCents;
    advancePercent = 100;
  } else if (opts.chargeMode === "ADVANCE") {
    const pct = opts.advancePercent ?? 50;
    if (pct < 1 || pct > 100) throw new Error("Advance percent must be 1–100");
    advancePercent = pct;
    chargeCents = Math.round((opts.projectTotalCents * pct) / 100);
  } else {
    if (opts.chargeCents == null || opts.chargeCents < 100) {
      throw new Error("Custom charge amount is required");
    }
    if (opts.chargeCents > opts.projectTotalCents) {
      throw new Error("Charge cannot exceed project total");
    }
    chargeCents = opts.chargeCents;
    advancePercent = Math.round((chargeCents / opts.projectTotalCents) * 100);
  }

  const product = await prisma.product.findFirst({
    where: { slug: CUSTOM_PROJECT_PRODUCT_SLUG, active: true },
  });
  if (!product) {
    throw new Error("Custom project product missing — run seed");
  }

  const terms =
    opts.terms ||
    (opts.chargeMode === "FULL"
      ? "Full project amount due on acceptance (Sales-approved)."
      : `${advancePercent}% advance of project total due now. Balance as agreed with Sales.`);

  const result = await prisma.$transaction(async (tx) => {
    const quoteNumber = await nextOrgNumber("QUOTATION");
    const quotation = await tx.quotation.create({
      data: {
        quoteNumber,
        leadId: lead.id,
        userId: customer.id,
        status: "SENT",
        customerName: lead.fullName,
        customerEmail: lead.email,
        company: lead.company,
        subtotalCents: opts.projectTotalCents,
        taxCents: 0,
        discountCents: 0,
        totalCents: opts.projectTotalCents,
        currency: "LKR",
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        terms,
        notes: opts.notes || null,
        items: {
          create: [
            {
              description: opts.description,
              quantity: 1,
              unitPriceCents: opts.projectTotalCents,
              totalCents: opts.projectTotalCents,
            },
          ],
        },
      },
    });

    const cart = await tx.cart.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id },
    });

    // Replace any prior sales line for this lead
    const existingItems = await tx.cartItem.findMany({ where: { cartId: cart.id } });
    for (const item of existingItems) {
      if (!item.metaJson) continue;
      try {
        const meta = JSON.parse(item.metaJson) as { leadId?: string; salesProject?: boolean };
        if (meta.salesProject && meta.leadId === lead.id) {
          await tx.cartItem.delete({ where: { id: item.id } });
        }
      } catch {
        /* ignore */
      }
    }

    const balanceCents = Math.max(0, opts.projectTotalCents - chargeCents);
    const meta = {
      salesProject: true,
      leadId: lead.id,
      leadNumber: lead.leadNumber,
      quotationId: quotation.id,
      quoteNumber: quotation.quoteNumber,
      projectTotalCents: opts.projectTotalCents,
      chargeMode: opts.chargeMode,
      advancePercent,
      chargeCents,
      balanceCents,
      terms,
      decidedBy: "SALES",
    };

    const cartItem = await tx.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: 1,
        unitPriceCents: chargeCents,
        lineLabel: opts.description,
        salesLocked: true,
        metaJson: JSON.stringify(meta),
        providerCurrency: "LKR",
        exchangeRate: 1,
        exchangeRateLockedAt: new Date(),
        fxBufferPercent: 0,
      },
    });

    await tx.crmLead.update({
      where: { id: lead.id },
      data: {
        stage: "QUOTATION",
        valueCents: opts.projectTotalCents,
        interest: opts.description.slice(0, 200),
      },
    });

    await tx.crmActivity.create({
      data: {
        leadId: lead.id,
        userId: opts.actorId,
        type: "STATUS",
        body: `Sales accepted project → cart. Quote ${quotation.quoteNumber}. Charge ${chargeCents} cents (${opts.chargeMode}${advancePercent != null ? ` ${advancePercent}%` : ""}). Balance ${balanceCents} cents.`,
      },
    });

    return { quotation, cartItem, customerId: customer.id, chargeCents, balanceCents, advancePercent };
  });

  await logCustomerActivity({
    userId: result.customerId,
    category: "PROJECT",
    title: "Sales sent project terms to your cart",
    body: `${opts.description} · Pay now: ${result.chargeCents} cents · Balance: ${result.balanceCents} cents`,
    href: "/portal/cart",
    meta: {
      leadId: lead.id,
      quoteNumber: result.quotation.quoteNumber,
      chargeMode: opts.chargeMode,
    },
  });

  await notifyUser({
    userId: result.customerId,
    title: "Project terms ready — check your cart",
    body: `Sales approved “${opts.description}”. Review amount and checkout from Cart.`,
    category: "PROJECT",
    href: "/portal/cart",
  });

  void writeAuditLog({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    actorName: opts.actorName,
    action: "SALES_PROJECT_TO_CART",
    module: "crm",
    entityType: "CrmLead",
    entityId: lead.id,
    summary: `Accepted project for ${lead.email} → cart charge ${result.chargeCents}`,
    meta: {
      quoteNumber: result.quotation.quoteNumber,
      chargeMode: opts.chargeMode,
      projectTotalCents: opts.projectTotalCents,
      chargeCents: result.chargeCents,
    },
  });

  return result;
}
