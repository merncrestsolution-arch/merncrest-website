import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff, requireUser } from "@/lib/commerce";
import { sendQuotationEmail } from "@/lib/crm/send-quotation-email";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";

function calcTotals(
  items: { quantity: number; unitPriceCents: number }[],
  discountCents = 0,
  taxCents = 0
) {
  const lineItems = items.map((i) => ({
    ...i,
    totalCents: i.quantity * i.unitPriceCents,
  }));
  const subtotalCents = lineItems.reduce((s, i) => s + i.totalCents, 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);
  return { lineItems, subtotalCents, totalCents };
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);

  if (id) {
    const quote = await prisma.quotation.findFirst({
      where: {
        id,
        ...(isStaff ? {} : { userId: auth.user.id }),
      },
      include: {
        items: true,
        lead: { select: { id: true, fullName: true, stage: true, interest: true, email: true } },
      },
    });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ quotation: quote });
  }

  const quotes = await prisma.quotation.findMany({
    where: isStaff ? undefined : { userId: auth.user.id },
    include: { items: true, lead: { select: { fullName: true, stage: true, interest: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ quotations: quotes });
}

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPriceCents: z.number().int().min(0),
});

const createSchema = z.object({
  leadId: z.string().optional(),
  userId: z.string().optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  company: z.string().optional(),
  items: z.array(itemSchema).min(1),
  taxCents: z.number().int().min(0).optional(),
  discountCents: z.number().int().min(0).optional(),
  validDays: z.number().int().min(1).max(90).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  send: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quotation" }, { status: 400 });
    }

    const items = parsed.data.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      totalCents: i.quantity * i.unitPriceCents,
    }));
    const discountCents = parsed.data.discountCents ?? 0;
    const taxCents = parsed.data.taxCents ?? 0;
    const subtotalCents = items.reduce((s, i) => s + i.totalCents, 0);
    const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);
    const validUntil = new Date(
      Date.now() + (parsed.data.validDays ?? 14) * 24 * 60 * 60 * 1000
    );

    const quote = await prisma.quotation.create({
      data: {
        quoteNumber: nextNumber("QT"),
        leadId: parsed.data.leadId,
        userId: parsed.data.userId,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        company: parsed.data.company,
        subtotalCents,
        taxCents,
        discountCents,
        totalCents,
        validUntil,
        terms: parsed.data.terms || "Valid for the stated period. 50% advance for custom projects.",
        notes: parsed.data.notes,
        status: parsed.data.send ? "SENT" : "DRAFT",
        items: { create: items },
      },
      include: { items: true },
    });

    if (parsed.data.leadId) {
      await prisma.crmLead.update({
        where: { id: parsed.data.leadId },
        data: {
          stage: "QUOTATION",
          activities: {
            create: {
              userId: auth.user.id,
              type: "STATUS",
              body: `Quotation ${quote.quoteNumber} created (${quote.status})`,
            },
          },
        },
      });
    }

    if (parsed.data.userId && parsed.data.send) {
      await notifyUser({
        userId: parsed.data.userId,
        title: `Quotation ${quote.quoteNumber}`,
        body: `New quote ready for review — total pending approval.`,
        category: "ORDER",
        href: "/portal/orders",
      });
    }

    return NextResponse.json({ quotation: quote }, { status: 201 });
  } catch (error) {
    console.error("[quotations:post]", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}

const updateSchema = z.object({
  quotationId: z.string(),
  customerName: z.string().min(2).optional(),
  customerEmail: z.string().email().optional(),
  company: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1).optional(),
  taxCents: z.number().int().min(0).optional(),
  discountCents: z.number().int().min(0).optional(),
  validDays: z.number().int().min(1).max(90).optional(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["PENDING_REVIEW", "DRAFT", "SENT"]).optional(),
});

/** Staff update quotation before sending */
export async function PUT(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const existing = await prisma.quotation.findUnique({
      where: { id: parsed.data.quotationId },
      include: { items: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status === "SENT" || existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "Cannot edit a sent or accepted quotation" }, { status: 400 });
    }

    const discountCents = parsed.data.discountCents ?? existing.discountCents;
    const taxCents = parsed.data.taxCents ?? existing.taxCents;
    const itemInput =
      parsed.data.items ??
      existing.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      }));
    const { lineItems, subtotalCents, totalCents } = calcTotals(itemInput, discountCents, taxCents);

    const validUntil = parsed.data.validDays
      ? new Date(Date.now() + parsed.data.validDays * 24 * 60 * 60 * 1000)
      : existing.validUntil;

    const quote = await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: existing.id } });
      return tx.quotation.update({
        where: { id: existing.id },
        data: {
          customerName: parsed.data.customerName ?? existing.customerName,
          customerEmail: parsed.data.customerEmail ?? existing.customerEmail,
          company: parsed.data.company !== undefined ? parsed.data.company : existing.company,
          subtotalCents,
          taxCents,
          discountCents,
          totalCents,
          validUntil,
          terms: parsed.data.terms !== undefined ? parsed.data.terms : existing.terms,
          notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,
          status: parsed.data.status ?? (existing.status === "PENDING_REVIEW" ? "DRAFT" : existing.status),
          items: { create: lineItems },
        },
        include: { items: true, lead: { select: { fullName: true, stage: true, interest: true } } },
      });
    });

    return NextResponse.json({ quotation: quote });
  } catch (error) {
    console.error("[quotations:put]", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}

const actionSchema = z.object({
  quotationId: z.string(),
  action: z.enum(["accept", "reject", "changes", "send"]),
  note: z.string().optional(),
});

/** Customer accept/reject OR staff send */
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
    const quote = await prisma.quotation.findFirst({
      where: {
        id: parsed.data.quotationId,
        ...(isStaff ? {} : { userId: auth.user.id }),
      },
      include: { items: true },
    });
    if (!quote) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (parsed.data.action === "send" && isStaff) {
      if (!quote.items.length) {
        return NextResponse.json({ error: "Quotation has no line items" }, { status: 400 });
      }
      if (quote.totalCents <= 0) {
        return NextResponse.json(
          { error: "Set pricing before sending — total must be greater than zero" },
          { status: 400 }
        );
      }

      await sendQuotationEmail(quote.id, auth.user.id);

      const updated = await prisma.quotation.update({
        where: { id: quote.id },
        data: { status: "SENT" },
        include: { items: true },
      });

      if (quote.leadId) {
        await prisma.crmLead.update({
          where: { id: quote.leadId },
          data: {
            stage: "QUOTATION",
            activities: {
              create: {
                userId: auth.user.id,
                type: "EMAIL",
                body: `Quotation ${quote.quoteNumber} sent to ${quote.customerEmail}`,
              },
            },
          },
        });
      }

      if (quote.userId) {
        await notifyUser({
          userId: quote.userId,
          title: `Quotation ${quote.quoteNumber}`,
          body: "Your quotation has been emailed — check your inbox.",
          category: "ORDER",
          href: "/portal/orders",
        });
      }

      return NextResponse.json({
        quotation: updated,
        message: `Quotation emailed to ${quote.customerEmail}`,
      });
    }

    if (parsed.data.action === "reject") {
      const updated = await prisma.quotation.update({
        where: { id: quote.id },
        data: { status: "REJECTED", notes: parsed.data.note || quote.notes },
        include: { items: true },
      });
      return NextResponse.json({ quotation: updated });
    }

    if (parsed.data.action === "changes") {
      const updated = await prisma.quotation.update({
        where: { id: quote.id },
        data: { status: "CHANGES_REQUESTED", notes: parsed.data.note || quote.notes },
        include: { items: true },
      });
      return NextResponse.json({ quotation: updated });
    }

    // accept → create order + invoice
    if (parsed.data.action === "accept") {
      if (quote.status === "ACCEPTED" && quote.orderId) {
        return NextResponse.json({ quotation: quote, message: "Already accepted" });
      }

      const userId = quote.userId || auth.user.id;
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: nextNumber("ORD"),
            userId,
            status: "PENDING",
            subtotalCents: quote.subtotalCents,
            taxCents: quote.taxCents,
            discountCents: quote.discountCents,
            totalCents: quote.totalCents,
            currency: quote.currency,
            notes: `From quotation ${quote.quoteNumber}`,
            items: {
              create: quote.items.map((i) => ({
                productName: i.description,
                productSlug: `quote-item`,
                quantity: i.quantity,
                unitPriceCents: i.unitPriceCents,
                totalCents: i.totalCents,
                billingPeriod: "ONCE",
              })),
            },
          },
        });

        await tx.invoice.create({
          data: {
            invoiceNumber: nextNumber("INV"),
            orderId: order.id,
            userId,
            status: "SENT",
            subtotalCents: quote.subtotalCents,
            taxCents: quote.taxCents,
            totalCents: quote.totalCents,
            currency: quote.currency,
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        const updated = await tx.quotation.update({
          where: { id: quote.id },
          data: { status: "ACCEPTED", orderId: order.id, userId },
          include: { items: true },
        });

        if (quote.leadId) {
          await tx.crmLead.update({
            where: { id: quote.leadId },
            data: {
              stage: "WON",
              activities: {
                create: {
                  type: "STATUS",
                  body: `Quote ${quote.quoteNumber} accepted → order ${order.orderNumber}`,
                },
              },
            },
          });
        }

        return { quotation: updated, order };
      });

      await notifyUser({
        userId,
        title: `Quote accepted · ${quote.quoteNumber}`,
        body: `Order ${result.order.orderNumber} created — pay invoice to proceed.`,
        category: "ORDER",
        href: "/portal/invoices",
      });

      return NextResponse.json({
        quotation: result.quotation,
        order: result.order,
        message: "Quotation accepted — order and invoice created",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[quotations:patch]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
