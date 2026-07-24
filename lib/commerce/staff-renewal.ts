import { prisma } from "@/lib/db";
import { lockFxQuote } from "@/lib/providers/fx";
import { formatMoney } from "@/lib/commerce-format";
import { siteUrl } from "@/lib/support/chat-knowledge";
import { writeAuditLog } from "@/lib/erp/audit";
import { appendSystemMessage } from "@/lib/chat/conversations";
import { publishChatEvent } from "@/lib/chat/events";

export type RenewalType = "domain" | "hosting" | "ssl";

export type StaffRenewalResult = {
  ok: true;
  type: RenewalType;
  label: string;
  priceCents: number;
  currency: string;
  checkoutUrl: string;
  cartItemId: string;
  message: string;
};

async function findDomainProduct(tld: string) {
  const normalized = tld.replace(/^\./, "").toLowerCase();
  const slugCandidates = [
    `domain-${normalized.replace(/\./g, "-")}-registration`,
    `domain-${normalized}-registration`,
    normalized === "com" ? "domain-com-registration" : null,
    normalized === "lk" ? "domain-lk-registration" : null,
    normalized === "com.lk" ? "domain-com-lk-registration" : null,
  ].filter(Boolean) as string[];

  for (const slug of slugCandidates) {
    const product = await prisma.product.findFirst({
      where: { slug, active: true, category: "domains" },
    });
    if (product) return product;
  }

  return prisma.product.findFirst({
    where: { active: true, category: "domains" },
    orderBy: { sortOrder: "asc" },
  });
}

async function findHostingProduct(planCode: string) {
  const byPlan = await prisma.product.findFirst({
    where: {
      active: true,
      OR: [
        { providerProductId: planCode },
        { slug: planCode },
        { slug: { contains: planCode.replace(/_/g, "-") } },
      ],
    },
  });
  if (byPlan) return byPlan;

  return prisma.product.findFirst({
    where: { active: true, category: "hosting" },
    orderBy: { sortOrder: "asc" },
  });
}

async function addRenewalToCustomerCart(opts: {
  customerUserId: string;
  productId: string;
  meta: Record<string, string>;
  quantity?: number;
}) {
  const product = await prisma.product.findFirst({
    where: { id: opts.productId, active: true },
  });
  if (!product) throw new Error("Renewal product not found");

  const cart = await prisma.cart.upsert({
    where: { userId: opts.customerUserId },
    update: {},
    create: { userId: opts.customerUserId },
  });

  const quote = await lockFxQuote(
    product.providerPriceCents ?? product.priceCents,
    product.currency || "LKR"
  );

  const item = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: opts.quantity ?? 1,
      metaJson: JSON.stringify(opts.meta),
      providerCurrency: quote.providerCurrency,
      exchangeRate: quote.exchangeRate,
      exchangeRateLockedAt: quote.exchangeRateLockedAt,
      fxBufferPercent: quote.fxBufferPercent,
    },
  });

  return { product, item };
}

/** Staff-initiated renewal — adds line to customer cart and returns checkout link. */
export async function staffInitiateRenewal(opts: {
  customerUserId: string;
  type: RenewalType;
  serviceId: string;
  staffUserId: string;
  staffName: string;
  sessionId?: string;
}): Promise<StaffRenewalResult> {
  const customer = await prisma.user.findFirst({
    where: { id: opts.customerUserId, role: "CUSTOMER" },
    select: { id: true, email: true, fullName: true },
  });
  if (!customer) throw new Error("Customer not found");

  let label = "";
  let meta: Record<string, string> = { action: "renew" };
  let productId = "";

  if (opts.type === "domain") {
    const domain = await prisma.domain.findFirst({
      where: { id: opts.serviceId, userId: opts.customerUserId },
    });
    if (!domain) throw new Error("Domain not found for this customer");

    const product = await findDomainProduct(domain.tld);
    if (!product) throw new Error("No domain renewal product configured");

    label = `${domain.name}.${domain.tld}`;
    productId = product.id;
    meta = {
      action: "renew",
      domainName: `${domain.name}.${domain.tld}`,
      sld: domain.name,
      tld: domain.tld,
      domainId: domain.id,
    };
  } else if (opts.type === "hosting" || opts.type === "ssl") {
    const hosting = await prisma.hostingAccount.findFirst({
      where: { id: opts.serviceId, userId: opts.customerUserId },
    });
    if (!hosting) throw new Error("Hosting account not found for this customer");

    const product = await findHostingProduct(hosting.planCode);
    if (!product) throw new Error("No hosting renewal product configured");

    label = opts.type === "ssl" ? `SSL · ${hosting.label}` : hosting.label;
    productId = product.id;
    meta = {
      action: opts.type === "ssl" ? "renew_ssl" : "renew",
      planCode: hosting.planCode,
      hostingAccountId: hosting.id,
      domainName: hosting.primaryDomain || "",
    };
  }

  const { product, item } = await addRenewalToCustomerCart({
    customerUserId: opts.customerUserId,
    productId,
    meta,
  });

  const checkoutUrl = siteUrl("/portal/cart");
  const priceLabel = formatMoney(product.priceCents, product.currency);
  const message =
    opts.type === "ssl"
      ? `I've added SSL renewal for ${label} (${priceLabel}) to your cart. Complete payment here: ${checkoutUrl}`
      : `I've added renewal for ${label} (${priceLabel}) to your cart. Complete payment here: ${checkoutUrl}`;

  if (opts.sessionId) {
    await appendSystemMessage(
      opts.sessionId,
      `${message}\n\nOur team can help if you have any questions.`
    );
    publishChatEvent({ type: "message", sessionId: opts.sessionId });
    publishChatEvent({ type: "inbox_updated" });
  }

  await writeAuditLog({
    actorId: opts.staffUserId,
    actorName: opts.staffName,
    action: "STAFF_RENEWAL_INITIATED",
    module: "CHAT",
    entityType: opts.type === "domain" ? "Domain" : "HostingAccount",
    entityId: opts.serviceId,
    summary: `Staff renewal ${opts.type}: ${label} for ${customer.email}`,
    meta: {
      customerUserId: opts.customerUserId,
      sessionId: opts.sessionId,
      cartItemId: item.id,
      priceCents: product.priceCents,
    },
  });

  return {
    ok: true,
    type: opts.type,
    label,
    priceCents: product.priceCents,
    currency: product.currency,
    checkoutUrl,
    cartItemId: item.id,
    message,
  };
}
