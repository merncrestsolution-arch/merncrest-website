import { prisma } from "@/lib/db";
import { nextOrgNumber } from "@/lib/commerce/org-numbers";
import { calcBillingTotals } from "@/lib/billing/calc-totals";
import { vatRatePercent } from "@/lib/billing/vat";
import { getServiceTypeLabel } from "@/shared/service-types";
import { SL_TIMEZONE, formatSriLankaDate } from "@/lib/timezone";
import { notifyUser } from "@/lib/support/notify";
import { sendMail } from "@/lib/mail";
import type { Prisma } from "@prisma/client";

const ISSUE_WINDOW_DAYS = 14;

function toDateKeyInSl(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: SL_TIMEZONE });
}

function daysUntilInSl(target: Date, from = new Date()): number {
  const fromKey = toDateKeyInSl(from);
  const targetKey = toDateKeyInSl(target);
  return Math.round((Date.parse(targetKey) - Date.parse(fromKey)) / 86400000);
}

function readMetadata(record: unknown): Record<string, unknown> {
  if (record && typeof record === "object" && !Array.isArray(record)) {
    return record as Record<string, unknown>;
  }
  return {};
}

function renewalCostFromMetadata(metadata: unknown): number | null {
  const meta = readMetadata(metadata);
  const cents = meta.renewalCostCents;
  if (typeof cents === "number" && cents > 0) return Math.round(cents);
  return null;
}

function lastInvoicedForRenewal(metadata: unknown, renewalDate: Date): boolean {
  const meta = readMetadata(metadata);
  const key = meta.lastRenewalInvoiceFor;
  if (typeof key !== "string") return false;
  return key === toDateKeyInSl(renewalDate);
}

export async function processRenewalInvoices(): Promise<{
  processed: number;
  created: number;
  skipped: number;
  invoices: Array<{ invoiceNumber: string; serviceId: string; amountCents: number }>;
}> {
  const now = new Date();
  const defaultVat = await vatRatePercent();

  const services = await prisma.projectService.findMany({
    where: {
      deletedAt: null,
      renewalDate: { not: null },
      status: { in: ["ACTIVE", "PENDING_RENEWAL"] },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          clientId: true,
          client: { select: { id: true, email: true, fullName: true, company: true } },
        },
      },
      serviceDomain: { select: { domainName: true } },
      serviceHosting: { select: { packageName: true } },
    },
  });

  let processed = 0;
  let created = 0;
  let skipped = 0;
  const invoices: Array<{ invoiceNumber: string; serviceId: string; amountCents: number }> = [];

  for (const service of services) {
    processed += 1;
    if (!service.renewalDate || !service.project.clientId) {
      skipped += 1;
      continue;
    }

    const daysLeft = daysUntilInSl(service.renewalDate, now);
    if (daysLeft < 0 || daysLeft > ISSUE_WINDOW_DAYS) {
      skipped += 1;
      continue;
    }

    if (lastInvoicedForRenewal(service.metadata, service.renewalDate)) {
      skipped += 1;
      continue;
    }

    const renewalCostCents = renewalCostFromMetadata(service.metadata);
    if (!renewalCostCents) {
      skipped += 1;
      continue;
    }

    const serviceLabel =
      service.serviceDomain?.domainName ??
      service.serviceHosting?.packageName ??
      getServiceTypeLabel(service.serviceType);

    const description = `Renewal — ${serviceLabel} (${getServiceTypeLabel(service.serviceType)})`;
    const totals = calcBillingTotals({
      lineSubtotalCents: renewalCostCents,
      vatRatePercent: 0,
      defaultVatRatePercent: defaultVat,
    });

    const dueAt = service.renewalDate;
    const customerId = service.project.clientId;
    const orderNumber = await nextOrgNumber("ORDER");

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customerId,
        status: "WAITING_PAYMENT",
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        currency: "LKR",
        notes: `Service renewal for project ${service.project.name}`,
        items: {
          create: [{
            productName: description,
            productSlug: "service-renewal",
            quantity: 1,
            unitPriceCents: renewalCostCents,
            totalCents: renewalCostCents,
            billingPeriod: "ONCE",
          }],
        },
      },
    });

    const invoiceNumber = await nextOrgNumber("INVOICE");
    const renewalKey = toDateKeyInSl(service.renewalDate);
    const meta = readMetadata(service.metadata);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          userId: customerId,
          serviceProjectId: service.projectId,
          status: "SENT",
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          paidCents: 0,
          currency: "LKR",
          lineItemsJson: JSON.stringify({
            lines: [{ description, qty: 1, unitCents: renewalCostCents }],
            discountCents: totals.discountCents,
            vatRatePercent: totals.vatRatePercent,
            notes: `Renewal due ${formatSriLankaDate(service.renewalDate)}`,
            projectServiceId: service.id,
          }),
          dueAt,
        },
      });

      await tx.projectService.update({
        where: { id: service.id },
        data: {
          status: "PENDING_RENEWAL",
          metadata: {
            ...meta,
            lastRenewalInvoiceFor: renewalKey,
            lastRenewalInvoiceId: inv.id,
            lastRenewalInvoiceNumber: invoiceNumber,
          } as Prisma.InputJsonValue,
        },
      });

      return inv;
    });

    created += 1;
    invoices.push({
      invoiceNumber: invoice.invoiceNumber,
      serviceId: service.id,
      amountCents: invoice.totalCents,
    });

    const client = service.project.client;
    const renewalLabel = formatSriLankaDate(service.renewalDate);

    void notifyUser({
      userId: customerId,
      title: "Renewal invoice issued",
      body: `${description} — ${invoiceNumber} due ${renewalLabel}`,
      category: "BILLING",
      href: "/portal/invoices",
    });

    if (client.email) {
      void sendMail({
        to: client.email,
        subject: `Renewal invoice ${invoiceNumber} — MernCrest`,
        text: [
          `Hi ${client.fullName},`,
          "",
          `Your renewal invoice ${invoiceNumber} for ${description} is ready.`,
          `Amount due: LKR ${(invoice.totalCents / 100).toFixed(2)}`,
          `Due date: ${renewalLabel}`,
          "",
          "Pay via your customer portal: https://merncrest.lk/en/portal/invoices",
          "",
          "Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk",
        ].join("\n"),
        html: `<p>Your renewal invoice <strong>${invoiceNumber}</strong> is ready. Due ${renewalLabel}.</p><p><a href="https://merncrest.lk/en/portal/invoices">View in portal</a></p>`,
      });
    }
  }

  return { processed, created, skipped, invoices };
}
