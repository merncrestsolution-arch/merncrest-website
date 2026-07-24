import { prisma } from "@/lib/db";
import { phoneMatchVariants } from "@/lib/support/whatsapp-phone";

export type IdentifiedBy =
  | "session_user"
  | "email"
  | "phone"
  | "domain"
  | "customer_code"
  | "invoice"
  | "company"
  | "lead_email"
  | "lead_phone";

export type IdentifyResult = {
  userId: string | null;
  identifiedBy: IdentifiedBy[];
  confidence: "high" | "medium" | "low" | "none";
};

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /(?:\+94|0)?7[0-9]{8}\b|\+?\d{10,14}\b/g;
const DOMAIN_RE =
  /\b([a-z0-9][a-z0-9-]{0,61}\.(?:lk|com|net|org|edu|gov|info|biz|co\.uk|io|dev))\b/gi;
const CUSTOMER_CODE_RE = /\bMC-[A-Z0-9]{4,12}\b/gi;
const INVOICE_RE = /\bINV-\d{4}-\d{4,}\b/gi;

const SKIP_EMAILS = new Set(["guest@channel.merncrest.lk", "noreply@merncrest.lk"]);

export type ExtractedIdentifiers = {
  emails: string[];
  phones: string[];
  domains: string[];
  customerCodes: string[];
  invoiceNumbers: string[];
};

export function extractIdentifiersFromText(text: string): ExtractedIdentifiers {
  const emails = Array.from(
    new Set(
      (text.match(EMAIL_RE) || [])
        .map((e) => e.toLowerCase())
        .filter((e) => !SKIP_EMAILS.has(e) && !e.endsWith("@channel.merncrest.lk"))
    )
  );
  const phones = Array.from(new Set(text.match(PHONE_RE) || []));
  const domains = Array.from(
    new Set(
      (text.match(DOMAIN_RE) || []).map((d) => d.toLowerCase()).filter((d) => !d.includes("merncrest"))
    )
  );
  const customerCodes = Array.from(
    new Set((text.match(CUSTOMER_CODE_RE) || []).map((c) => c.toUpperCase()))
  );
  const invoiceNumbers = Array.from(
    new Set((text.match(INVOICE_RE) || []).map((i) => i.toUpperCase()))
  );

  return { emails, phones, domains, customerCodes, invoiceNumbers };
}

export async function findCustomerUser(opts: {
  email?: string | null;
  phone?: string | null;
  domain?: string | null;
  customerCode?: string | null;
  invoiceNumber?: string | null;
  company?: string | null;
}): Promise<{ userId: string; matchedBy: IdentifiedBy } | null> {
  const email = opts.email?.toLowerCase().trim() || null;
  if (email && !SKIP_EMAILS.has(email)) {
    const user = await prisma.user.findFirst({
      where: { email, role: "CUSTOMER" },
      select: { id: true },
    });
    if (user) return { userId: user.id, matchedBy: "email" };
  }

  if (opts.customerCode) {
    const code = opts.customerCode.toUpperCase();
    const profile = await prisma.customerProfile.findFirst({
      where: { customerCode: code },
      select: { userId: true },
    });
    if (profile) return { userId: profile.userId, matchedBy: "customer_code" };
  }

  if (opts.phone) {
    const variants = phoneMatchVariants(opts.phone);
    const profile = await prisma.customerProfile.findFirst({
      where: {
        OR: variants.flatMap((v) => [
          { phone: { contains: v.slice(-9) } },
          { whatsapp: { contains: v.slice(-9) } },
        ]),
      },
      select: { userId: true },
    });
    if (profile) return { userId: profile.userId, matchedBy: "phone" };
  }

  if (opts.invoiceNumber) {
    const invoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: opts.invoiceNumber.toUpperCase() },
      select: { userId: true },
    });
    if (invoice) return { userId: invoice.userId, matchedBy: "invoice" };
  }

  if (opts.domain) {
    const parts = opts.domain.toLowerCase().split(".");
    if (parts.length >= 2) {
      const tld = parts.pop()!;
      const name = parts.join(".");
      const domain = await prisma.domain.findFirst({
        where: { name, tld },
        select: { userId: true },
      });
      if (domain) return { userId: domain.userId, matchedBy: "domain" };
    }
  }

  if (opts.company && opts.company.trim().length >= 3) {
    const company = opts.company.trim();
    const user = await prisma.user.findFirst({
      where: {
        role: "CUSTOMER",
        company: { equals: company, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (user) return { userId: user.id, matchedBy: "company" };
  }

  return null;
}

export async function identifyCustomerFromSession(sessionId: string): Promise<IdentifyResult> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  if (!session) {
    return { userId: null, identifiedBy: [], confidence: "none" };
  }

  if (session.userId) {
    return {
      userId: session.userId,
      identifiedBy: ["session_user"],
      confidence: "high",
    };
  }

  const identifiedBy: IdentifiedBy[] = [];
  const transcript = session.messages.map((m) => m.body).join("\n");
  const extracted = extractIdentifiersFromText(transcript);

  const candidates: Parameters<typeof findCustomerUser>[0][] = [];

  if (session.lead?.email && !session.lead.email.endsWith("@channel.merncrest.lk")) {
    candidates.push({ email: session.lead.email });
  }
  if (session.lead?.phone) candidates.push({ phone: session.lead.phone });
  if (session.lead?.company) candidates.push({ company: session.lead.company });

  for (const email of extracted.emails) candidates.push({ email });
  for (const phone of extracted.phones) candidates.push({ phone });
  for (const domain of extracted.domains) candidates.push({ domain });
  for (const code of extracted.customerCodes) candidates.push({ customerCode: code });
  for (const inv of extracted.invoiceNumbers) candidates.push({ invoiceNumber: inv });

  for (const opts of candidates) {
    const found = await findCustomerUser(opts);
    if (found) {
      if (found.matchedBy === "email" && session.lead?.email) identifiedBy.push("lead_email");
      else if (found.matchedBy === "phone" && session.lead?.phone) identifiedBy.push("lead_phone");
      else identifiedBy.push(found.matchedBy);

      const confidence =
        found.matchedBy === "customer_code" || found.matchedBy === "invoice"
          ? "high"
          : found.matchedBy === "email" || found.matchedBy === "phone"
            ? "medium"
            : "low";

      return { userId: found.userId, identifiedBy: Array.from(new Set(identifiedBy)), confidence };
    }
  }

  return { userId: null, identifiedBy: [], confidence: "none" };
}

/** Link session to a known customer account when identifiers match. */
export async function autoLinkSessionCustomer(sessionId: string): Promise<IdentifyResult> {
  const result = await identifyCustomerFromSession(sessionId);
  if (result.userId) {
    await prisma.chatSession.updateMany({
      where: { id: sessionId, userId: null },
      data: { userId: result.userId },
    });
  }
  return result;
}
