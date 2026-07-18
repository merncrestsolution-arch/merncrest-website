import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendProvisioningEmail } from "@/lib/mail";

type Tx = Prisma.TransactionClient;

function addPeriod(from: Date, period: string) {
  const d = new Date(from);
  if (period === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else if (period === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

function parseMeta(metaJson: string | null | undefined): Record<string, string> {
  if (!metaJson) return {};
  try {
    return JSON.parse(metaJson) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Provision domains, hosting, and subscriptions after a successful payment. */
export async function activateOrderServices(orderId: string, tx?: Tx) {
  const db = tx ?? prisma;
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  const now = new Date();

  for (const item of order.items) {
    const meta = parseMeta(item.metaJson);
    const slug = item.productSlug;
    const period = item.billingPeriod || "ONCE";

    if (slug.includes("domain") || meta.domainName) {
      const full = (meta.domainName || `${meta.sld || "example"}.${meta.tld || "com"}`).toLowerCase();
      const parts = full.split(".");
      const tld = parts.slice(1).join(".") || "com";
      const name = parts[0] || "example";

      const existing = await db.domain.findUnique({
        where: { name_tld: { name, tld } },
      });

      if (!existing) {
        const domain = await db.domain.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            name,
            tld,
            status: "ACTIVE",
            registeredAt: now,
            expiresAt: addPeriod(now, "YEARLY"),
            autoRenew: true,
            locked: false,
          },
        });

        await db.dnsRecord.createMany({
          data: [
            { domainId: domain.id, type: "A", host: "@", value: "0.0.0.0", ttl: 3600 },
            { domainId: domain.id, type: "CNAME", host: "www", value: `${name}.${tld}`, ttl: 3600 },
            { domainId: domain.id, type: "MX", host: "@", value: "mail.merncrest.lk", ttl: 3600, priority: 10 },
            { domainId: domain.id, type: "TXT", host: "@", value: "v=spf1 include:merncrest.lk ~all", ttl: 3600 },
          ],
        });
      } else if (existing.userId === order.userId) {
        await db.domain.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            orderId: order.id,
            expiresAt: addPeriod(existing.expiresAt || now, "YEARLY"),
            registeredAt: existing.registeredAt || now,
          },
        });
      }
    }

    if (slug.includes("hosting") || slug.includes("vps") || meta.planCode) {
      const planCode = meta.planCode || slug;
      const specs =
        slug.includes("vps")
          ? { diskMb: 40960, bandwidthGb: 1000, ramMb: 4096 }
          : { diskMb: 10240, bandwidthGb: 100, ramMb: 512 };

      await db.hostingAccount.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          label: item.productName,
          planCode,
          status: "ACTIVE",
          primaryDomain: meta.domainName || null,
          diskMb: specs.diskMb,
          bandwidthGb: specs.bandwidthGb,
          ramMb: specs.ramMb,
          diskUsedMb: Math.floor(specs.diskMb * 0.08),
          bandwidthUsedGb: 2,
          ramUsedMb: Math.floor(specs.ramMb * 0.25),
          cpuPercent: 8,
          sslStatus: "ACTIVE",
          backupStatus: "OK",
          panelUrl: "https://panel.merncrest.lk",
          activatedAt: now,
          renewsAt: period === "ONCE" ? null : addPeriod(now, period),
        },
      });
    }

    if (period === "MONTHLY" || period === "YEARLY") {
      await db.subscription.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          productSlug: slug,
          productName: item.productName,
          status: "ACTIVE",
          billingPeriod: period,
          amountCents: item.unitPriceCents,
          currency: order.currency,
          nextBillingAt: addPeriod(now, period),
        },
      });
    }
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED" },
  });

  const summary: string[] = [];
  const domains = await db.domain.findMany({ where: { orderId: order.id } });
  const hosting = await db.hostingAccount.findMany({ where: { orderId: order.id } });
  domains.forEach((d) => summary.push(`Domain active: ${d.name}.${d.tld}`));
  hosting.forEach((h) => summary.push(`Hosting active: ${h.label} (${h.status})`));
  if (summary.length === 0) summary.push("Order completed — check your portal for services.");

  const user = await db.user.findUnique({ where: { id: order.userId } });
  if (user?.email) {
    // Fire-and-forget outside strict tx concerns when called with prisma root
    void sendProvisioningEmail({
      to: user.email,
      orderNumber: order.orderNumber,
      summary,
    });
  }
}

export async function markInvoicePaid(opts: {
  invoiceId: string;
  userId: string;
  method: string;
  providerRef: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: opts.invoiceId, userId: opts.userId },
      include: { order: true },
    });
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "PAID") {
      return { invoice, alreadyPaid: true as const };
    }

    const payment = await tx.payment.create({
      data: {
        userId: opts.userId,
        orderId: invoice.orderId,
        invoiceId: invoice.id,
        amountCents: invoice.totalCents,
        currency: invoice.currency,
        method: opts.method,
        status: "SUCCEEDED",
        providerRef: opts.providerRef,
      },
    });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await tx.order.update({
      where: { id: invoice.orderId },
      data: { status: "PROCESSING" },
    });

    await activateOrderServices(invoice.orderId, tx);

    return { payment, invoice: updatedInvoice, alreadyPaid: false as const };
  });
}

export function md5(value: string) {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}
