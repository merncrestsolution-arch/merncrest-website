import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff, requireUser } from "@/lib/commerce";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const isStaff = ["STAFF", "ADMIN", "OWNER"].includes(auth.user.role);
  const quotes = await prisma.quotation.findMany({
    where: isStaff ? undefined : { userId: auth.user.id },
    include: { items: true, lead: { select: { fullName: true, stage: true } } },
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
    const subtotalCents = items.reduce((s, i) => s + i.totalCents, 0);
    const discountCents = parsed.data.discountCents ?? 0;
    const taxCents = parsed.data.taxCents ?? 0;
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
      const updated = await prisma.quotation.update({
        where: { id: quote.id },
        data: { status: "SENT" },
        include: { items: true },
      });
      return NextResponse.json({ quotation: updated });
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
