import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendProvisioningEmail } from "@/lib/mail";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";
import {
  getAdapterForProviderId,
  getDomainAdapterForTld,
  getPrimaryDomainProvider,
} from "@/lib/providers/registry";

type Tx = Prisma.TransactionClient;

const MAX_PROVISION_ATTEMPTS = 3;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff: 500ms, 1500ms, 3500ms between attempts */
async function withProviderRetry<T>(
  label: string,
  fn: () => Promise<T>,
  isHardFail: (result: T) => boolean
): Promise<{ result: T; attempts: number }> {
  let last: T | undefined;
  let attempts = 0;
  for (let i = 0; i < MAX_PROVISION_ATTEMPTS; i++) {
    attempts = i + 1;
    try {
      last = await fn();
      if (!isHardFail(last)) return { result: last, attempts };
    } catch (error) {
      last = undefined;
      console.error(`[fulfillment:retry] ${label} attempt ${attempts}`, error);
      if (i === MAX_PROVISION_ATTEMPTS - 1) throw error;
    }
    if (i < MAX_PROVISION_ATTEMPTS - 1) {
      await sleep(500 * Math.pow(3, i));
    }
  }
  return { result: last as T, attempts };
}

async function notifyAdmins(title: string, body: string, href?: string) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "OWNER"] } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((a) =>
      notifyUser({
        userId: a.id,
        title,
        body,
        category: "ORDER",
        href: href || "/admin/orders",
      })
    )
  );
}

/**
 * Provision domains & hosting via Reseller Provider API after payment approval.
 * Flow: Customer → MernCrest → Provider API → Customer receives service
 *
 * Triggered automatically when an order reaches PAID (via markInvoicePaid /
 * admin payment verify). Retries provider calls up to 3× with exponential backoff.
 * On hard failure → PROVISIONING_FAILED + admin notify + AuditLog.
 * Manual admin re-provision remains available as fallback.
 */
export async function activateOrderServices(
  orderId: string,
  tx?: Tx,
  opts?: { actorId?: string; manual?: boolean }
) {
  const db = tx ?? prisma;
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  // Skip if already fully completed (idempotent) unless manual retry
  if (order.status === "COMPLETED" && !opts?.manual) {
    return { status: "COMPLETED" as const, alreadyDone: true };
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      status: "PROVISIONING",
      provisioningAttempts: { increment: 1 },
      lastProvisionError: null,
    },
  });

  const now = new Date();
  const defaultProvider = await getPrimaryDomainProvider();
  const failures: string[] = [];
  let anyHardFailure = false;

  try {
    for (const item of order.items) {
      const meta = parseMeta(item.metaJson);
      const slug = item.productSlug;
      const period = item.billingPeriod || "ONCE";
      const product = item.product;
      const providerId = product?.providerId || defaultProvider?.id || null;

      if (slug.includes("domain") || meta.domainName) {
        const full = (
          meta.domainName || `${meta.sld || "example"}.${meta.tld || "com"}`
        ).toLowerCase();
        const parts = full.split(".");
        const tld = parts.slice(1).join(".") || "com";
        const name = parts[0] || "example";
        const action = (meta.action as "register" | "renew" | "transfer") || "register";

        let providerRef: string | undefined;
        let nameservers = "ns1.provider.example,ns2.provider.example";
        let domainStatus: "ACTIVE" | "PENDING" | "TRANSFERRING" = "PENDING";
        let resolvedProviderId = providerId;

        const routed = await getDomainAdapterForTld(tld);
        const useRouted =
          routed.provider &&
          (routed.provider.code.toLowerCase().includes("namecheap") ||
            routed.provider.code.toLowerCase().includes("domainlk") ||
            !providerId);

        const bound =
          useRouted && routed.provider
            ? { provider: routed.provider, adapter: routed.adapter }
            : providerId
              ? await getAdapterForProviderId(providerId)
              : routed.provider
                ? { provider: routed.provider, adapter: routed.adapter }
                : null;

        if (bound) {
          resolvedProviderId = bound.provider.id;
          try {
            const { result, attempts } = await withProviderRetry(
              `domain:${name}.${tld}`,
              () =>
                bound.adapter.provisionDomain({
                  domain: `${name}.${tld}`,
                  sld: name,
                  tld,
                  action,
                  customerEmail: order.user.email,
                }),
              (r) => !r.success && r.status !== "PENDING" && r.status !== "PROVISIONING"
            );

            providerRef = result.providerRef;
            if (result.nameservers?.length) {
              nameservers = result.nameservers.join(",");
            }
            if (action === "transfer") {
              domainStatus = "TRANSFERRING";
            } else if (result.status === "ACTIVE" && result.success) {
              domainStatus = "ACTIVE";
            } else if (!result.success && result.status !== "PENDING") {
              anyHardFailure = true;
              failures.push(`${name}.${tld}: ${result.message || "provider failed"}`);
              domainStatus = "PENDING";
            } else {
              domainStatus = "PENDING";
            }

            void writeAuditLog({
              actorId: opts?.actorId,
              action: result.success ? "domain.provision" : "domain.provision_queued",
              module: "marketplace",
              entityType: "Domain",
              entityId: order.id,
              summary: result.message || `${name}.${tld} → ${domainStatus} (${attempts} attempts)`,
              meta: {
                orderId,
                providerRef,
                provider: bound.provider.code,
                status: domainStatus,
                attempts,
              },
            });
          } catch (error) {
            anyHardFailure = true;
            const msg = error instanceof Error ? error.message : "domain provision error";
            failures.push(`${name}.${tld}: ${msg}`);
            void writeAuditLog({
              actorId: opts?.actorId,
              action: "domain.provision_failed",
              module: "marketplace",
              entityType: "Domain",
              entityId: order.id,
              summary: msg,
              meta: { orderId, domain: `${name}.${tld}` },
            });
          }
        }

        const existing = await db.domain.findUnique({
          where: { name_tld: { name, tld } },
        });

        if (!existing) {
          const domain = await db.domain.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              providerId: resolvedProviderId,
              providerRef,
              name,
              tld,
              status: domainStatus,
              registeredAt: domainStatus === "ACTIVE" ? now : null,
              expiresAt: domainStatus === "ACTIVE" ? addPeriod(now, "YEARLY") : null,
              autoRenew: true,
              locked: false,
              nameservers,
            },
          });

          if (domainStatus === "ACTIVE") {
            await db.dnsRecord.createMany({
              data: [
                { domainId: domain.id, type: "A", host: "@", value: "0.0.0.0", ttl: 3600 },
                {
                  domainId: domain.id,
                  type: "CNAME",
                  host: "www",
                  value: `${name}.${tld}`,
                  ttl: 3600,
                },
                {
                  domainId: domain.id,
                  type: "MX",
                  host: "@",
                  value: "mail.provider.example",
                  ttl: 3600,
                  priority: 10,
                },
                {
                  domainId: domain.id,
                  type: "TXT",
                  host: "@",
                  value: "v=spf1 include:provider.example ~all",
                  ttl: 3600,
                },
              ],
            });
          }
        } else if (existing.userId === order.userId) {
          await db.domain.update({
            where: { id: existing.id },
            data: {
              status: domainStatus,
              orderId: order.id,
              providerId: resolvedProviderId ?? existing.providerId,
              providerRef: providerRef ?? existing.providerRef,
              expiresAt:
                domainStatus === "ACTIVE"
                  ? addPeriod(existing.expiresAt || now, "YEARLY")
                  : existing.expiresAt,
              registeredAt:
                domainStatus === "ACTIVE"
                  ? existing.registeredAt || now
                  : existing.registeredAt,
              nameservers,
            },
          });
        }
      }

      if (
        slug.includes("hosting") ||
        slug.includes("vps") ||
        product?.category === "hosting" ||
        product?.category === "vps" ||
        product?.category === "cloud" ||
        meta.planCode
      ) {
        const planCode = meta.planCode || product?.providerProductId || slug;
        let providerRef: string | undefined;
        let panelUrl = "https://panel.provider.example";
        let specs = { diskMb: 10240, bandwidthGb: 100, ramMb: 512 };

        if (product?.specsJson) {
          try {
            const parsed = JSON.parse(product.specsJson) as Record<string, number>;
            specs = {
              diskMb: parsed.diskMb || specs.diskMb,
              bandwidthGb: parsed.bandwidthGb || specs.bandwidthGb,
              ramMb: parsed.ramMb || specs.ramMb,
            };
          } catch {
            /* ignore */
          }
        } else if (slug.includes("vps")) {
          specs = { diskMb: 40960, bandwidthGb: 1000, ramMb: 4096 };
        }

        let hostingStatus: "ACTIVE" | "PENDING" | "PROVISIONING" = "PENDING";

        if (providerId) {
          const bound = await getAdapterForProviderId(providerId);
          if (bound) {
            try {
              const { result, attempts } = await withProviderRetry(
                `hosting:${planCode}`,
                () =>
                  bound.adapter.provisionHosting({
                    planCode,
                    providerProductId: product?.providerProductId || undefined,
                    primaryDomain: meta.domainName,
                    customerEmail: order.user.email,
                    label: item.productName,
                  }),
                (r) => !r.success && r.status !== "PENDING" && r.status !== "PROVISIONING"
              );

              providerRef = result.providerRef;
              if (result.panelUrl) panelUrl = result.panelUrl;
              if (result.specs) {
                specs = {
                  diskMb: result.specs.diskMb ?? specs.diskMb,
                  bandwidthGb: result.specs.bandwidthGb ?? specs.bandwidthGb,
                  ramMb: result.specs.ramMb ?? specs.ramMb,
                };
              }
              if (result.status === "ACTIVE" && result.success) {
                hostingStatus = "ACTIVE";
              } else if (!result.success && result.status !== "PENDING") {
                anyHardFailure = true;
                failures.push(`${item.productName}: ${result.message || "hosting failed"}`);
                hostingStatus = "PENDING";
              } else {
                hostingStatus = "PENDING";
              }

              void writeAuditLog({
                actorId: opts?.actorId,
                action: result.success ? "hosting.provision" : "hosting.provision_queued",
                module: "marketplace",
                entityType: "HostingAccount",
                entityId: order.id,
                summary:
                  result.message || `${item.productName} → ${hostingStatus} (${attempts} attempts)`,
                meta: { orderId, providerRef, provider: bound.provider.code, attempts },
              });
            } catch (error) {
              anyHardFailure = true;
              const msg = error instanceof Error ? error.message : "hosting provision error";
              failures.push(`${item.productName}: ${msg}`);
              void writeAuditLog({
                actorId: opts?.actorId,
                action: "hosting.provision_failed",
                module: "marketplace",
                entityType: "HostingAccount",
                entityId: order.id,
                summary: msg,
                meta: { orderId, planCode },
              });
            }
          }
        } else {
          providerRef = `manual-host-${order.id}-${item.id}`;
          hostingStatus = "PENDING";
        }

        // Idempotent: update existing hosting for this order+plan instead of duplicating
        const existingHost = await db.hostingAccount.findFirst({
          where: {
            orderId: order.id,
            planCode,
            userId: order.userId,
          },
        });

        const hostData = {
          userId: order.userId,
          orderId: order.id,
          providerId,
          providerRef,
          label: item.productName,
          planCode,
          status: hostingStatus,
          primaryDomain: meta.domainName || null,
          diskMb: specs.diskMb,
          bandwidthGb: specs.bandwidthGb,
          ramMb: specs.ramMb,
          diskUsedMb: hostingStatus === "ACTIVE" ? Math.floor(specs.diskMb * 0.08) : 0,
          bandwidthUsedGb: hostingStatus === "ACTIVE" ? 2 : 0,
          ramUsedMb: hostingStatus === "ACTIVE" ? Math.floor(specs.ramMb * 0.25) : 0,
          cpuPercent: hostingStatus === "ACTIVE" ? 8 : 0,
          sslStatus: hostingStatus === "ACTIVE" ? "ACTIVE" : "PENDING",
          backupStatus: "OK",
          panelUrl: hostingStatus === "ACTIVE" ? panelUrl : null,
          activatedAt: hostingStatus === "ACTIVE" ? now : null,
          renewsAt:
            hostingStatus === "ACTIVE" && period !== "ONCE" ? addPeriod(now, period) : null,
        };

        if (existingHost) {
          await db.hostingAccount.update({
            where: { id: existingHost.id },
            data: hostData,
          });
        } else {
          await db.hostingAccount.create({ data: hostData });
        }
      }

      if (period === "MONTHLY" || period === "YEARLY") {
        const existingSub = await db.subscription.findFirst({
          where: {
            orderId: order.id,
            productSlug: slug,
            userId: order.userId,
          },
        });
        if (!existingSub) {
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
    }

    if (anyHardFailure) {
      const errSummary = failures.join("; ").slice(0, 500);
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "PROVISIONING_FAILED",
          lastProvisionError: errSummary,
        },
      });

      void writeAuditLog({
        actorId: opts?.actorId,
        action: "order.provisioning_failed",
        module: "marketplace",
        entityType: "Order",
        entityId: order.id,
        summary: `Order ${order.orderNumber} provisioning failed after retries`,
        meta: { orderId, failures },
      });

      void notifyAdmins(
        `Provisioning failed: ${order.orderNumber}`,
        errSummary || "Provider API failed after 3 retries. Manual intervention required.",
        "/admin/orders?status=PROVISIONING_FAILED"
      );

      void notifyUser({
        userId: order.userId,
        title: "We're still setting up your service",
        body: `Order ${order.orderNumber} needs a bit longer — our team is on it and will update you shortly.`,
        category: "ORDER",
        href: "/portal/services",
      });

      return { status: "PROVISIONING_FAILED" as const, failures };
    }

    await db.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED", lastProvisionError: null },
    });

    const summary: string[] = [];
    const domains = await db.domain.findMany({ where: { orderId: order.id } });
    const hosting = await db.hostingAccount.findMany({ where: { orderId: order.id } });
    domains.forEach((d) =>
      summary.push(
        d.status === "ACTIVE"
          ? `Domain active: ${d.name}.${d.tld}`
          : `Domain pending activation: ${d.name}.${d.tld} (provider queue)`
      )
    );
    hosting.forEach((h) =>
      summary.push(
        h.status === "ACTIVE"
          ? `Hosting active: ${h.label}`
          : `Hosting pending activation: ${h.label}`
      )
    );
    if (summary.length === 0) summary.push("Order completed — check your portal for services.");

    if (order.user?.email) {
      void sendProvisioningEmail({
        to: order.user.email,
        orderNumber: order.orderNumber,
        summary,
      });
    }

    void notifyUser({
      userId: order.userId,
      title: `Order ${order.orderNumber} is ready`,
      body: summary.slice(0, 2).join(" · ") || "Your services are being set up.",
      category: "ORDER",
      href: "/portal/services",
    });

    void writeAuditLog({
      actorId: opts?.actorId,
      action: "order.provisioned",
      module: "marketplace",
      entityType: "Order",
      entityId: order.id,
      summary: `Order ${order.orderNumber} provisioned`,
      meta: { orderId },
    });

    return { status: "COMPLETED" as const, failures: [] as string[] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Provisioning failed";
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PROVISIONING_FAILED",
        lastProvisionError: msg.slice(0, 500),
      },
    });

    void writeAuditLog({
      actorId: opts?.actorId,
      action: "order.provisioning_failed",
      module: "marketplace",
      entityType: "Order",
      entityId: order.id,
      summary: msg,
      meta: { orderId },
    });

    void notifyAdmins(
      `Provisioning failed: ${order.orderNumber}`,
      msg,
      "/admin/orders?status=PROVISIONING_FAILED"
    );

    void notifyUser({
      userId: order.userId,
      title: "We're still setting up your service",
      body: `Order ${order.orderNumber} needs a bit longer — our team is on it and will update you shortly.`,
      category: "ORDER",
      href: "/portal/services",
    });

    return { status: "PROVISIONING_FAILED" as const, failures: [msg] };
  }
}

/**
 * Mark invoice paid → order PAID → auto-provision.
 * Verification (bank transfer) is the only required manual step in the order lifecycle.
 */
export async function markInvoicePaid(opts: {
  invoiceId: string;
  userId: string;
  method: string;
  providerRef: string;
  verifiedById?: string;
}) {
  const paid = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: opts.invoiceId, userId: opts.userId },
      include: { order: true },
    });
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "PAID") {
      return { invoice, alreadyPaid: true as const, orderId: invoice.orderId };
    }

    const existingPayment = await tx.payment.findFirst({
      where: {
        invoiceId: invoice.id,
        status: { in: ["PENDING", "AWAITING_VERIFICATION", "SUCCEEDED"] },
        method: opts.method,
      },
      orderBy: { createdAt: "desc" },
    });

    const payment = existingPayment
      ? await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "SUCCEEDED",
            providerRef: opts.providerRef,
            verifiedById: opts.verifiedById,
            verifiedAt: opts.verifiedById ? new Date() : existingPayment.verifiedAt,
          },
        })
      : await tx.payment.create({
          data: {
            userId: opts.userId,
            orderId: invoice.orderId,
            invoiceId: invoice.id,
            amountCents: invoice.totalCents,
            currency: invoice.currency,
            method: opts.method,
            status: "SUCCEEDED",
            providerRef: opts.providerRef,
            verifiedById: opts.verifiedById,
            verifiedAt: opts.verifiedById ? new Date() : null,
          },
        });

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    // Order → PAID triggers automated provisioning (outside txn for provider I/O)
    await tx.order.update({
      where: { id: invoice.orderId },
      data: { status: "PAID" },
    });

    return {
      payment,
      invoice: updatedInvoice,
      alreadyPaid: false as const,
      orderId: invoice.orderId,
    };
  });

  if (!paid.alreadyPaid) {
    // Auto-provision after PAID — primary path (no admin click required beyond payment verify)
    await activateOrderServices(paid.orderId, undefined, {
      actorId: opts.verifiedById,
    });
  }

  return paid;
}

export function md5(value: string) {
  return createHash("md5").update(value).digest("hex").toUpperCase();
}
