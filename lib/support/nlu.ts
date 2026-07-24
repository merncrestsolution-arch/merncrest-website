/**
 * Lightweight NLU for WhatsApp — intent classification + entity extraction.
 * Uses bag-of-words cosine similarity against training phrases (no external API required).
 * Optional: OPENAI_API_KEY upgrades scoring via embeddings-style keyword boost.
 */

export type NluIntent =
  | "GREETING"
  | "MENU"
  | "DOMAIN_SEARCH"
  | "HOSTING"
  | "VPS"
  | "SOFTWARE"
  | "QUOTATION"
  | "ORDERS"
  | "INVOICES"
  | "SUPPORT"
  | "HUMAN_AGENT"
  | "PAYMENT"
  | "LEAVE_STATUS"
  | "UNKNOWN";

export type NluEntity = {
  type: "domain" | "email" | "phone" | "amount" | "order_ref" | "ticket_ref";
  value: string;
};

export type NluResult = {
  intent: NluIntent;
  confidence: number;
  entities: NluEntity[];
  locale: "en" | "ta" | "si";
};

const INTENT_PHRASES: Record<NluIntent, string[]> = {
  GREETING: ["hi", "hello", "hey", "good morning", "vanakkam", "ayubowan", "start"],
  MENU: ["menu", "help", "options", "what can you do"],
  DOMAIN_SEARCH: [
    "search domain",
    "check domain",
    "is domain available",
    "register domain",
    "buy domain",
    "domain name",
  ],
  HOSTING: ["hosting", "web hosting", "shared hosting", "wordpress hosting", "i need hosting"],
  VPS: ["vps", "aws", "dedicated server", "cloud server", "virtual private"],
  SOFTWARE: [
    "website",
    "erp",
    "crm",
    "custom software",
    "mobile app",
    "need a website",
    "business website",
    "ai solution",
    "chatbot",
    "cloud",
    "pos",
    "school system",
    "hospital system",
  ],
  QUOTATION: ["quotation", "quote", "proposal", "pricing", "price estimate", "send me a quote"],
  ORDERS: ["my orders", "order status", "track order", "where is my order"],
  INVOICES: ["invoice", "my invoices", "pay invoice", "billing", "outstanding bill"],
  SUPPORT: [
    "support",
    "ticket",
    "website is down",
    "site down",
    "not working",
    "help me",
    "urgent issue",
  ],
  HUMAN_AGENT: [
    "speak to human",
    "talk to agent",
    "human agent",
    "operator",
    "real person",
    "customer care",
  ],
  PAYMENT: ["payment", "pay now", "how to pay", "bank transfer", "payment reminder"],
  LEAVE_STATUS: ["leave status", "my leave", "leave approved", "attendance"],
  UNKNOWN: [],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0B80-\u0BFF\u0D80-\u0DFF.\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function vectorize(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [k, v] of b) {
    nb += v * v;
    if (a.has(k)) dot += a.get(k)! * v;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function detectLocale(text: string): "en" | "ta" | "si" {
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0D80-\u0DFF]/.test(text)) return "si";
  const lower = text.toLowerCase();
  if (/\b(vanakkam|epdi|enna)\b/.test(lower)) return "ta";
  if (/\b(ayubowan|kohomada)\b/.test(lower)) return "si";
  return "en";
}

export function extractEntities(text: string): NluEntity[] {
  const entities: NluEntity[] = [];
  const domain = text.match(/\b([a-z0-9][a-z0-9-]{0,61}\.[a-z.]{2,})\b/i);
  if (domain) entities.push({ type: "domain", value: domain[1].toLowerCase() });
  const email = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (email) entities.push({ type: "email", value: email[0].toLowerCase() });
  const phone = text.match(/\+?\d[\d\s-]{8,}\d/);
  if (phone) entities.push({ type: "phone", value: phone[0].replace(/\D/g, "") });
  const amount = text.match(/(?:rs\.?|lkr|usd)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s?(?:lkr|rs)?/i);
  if (amount) entities.push({ type: "amount", value: amount[1].replace(/,/g, "") });
  const order = text.match(/\b(ORD[- ]?\w+)\b/i);
  if (order) entities.push({ type: "order_ref", value: order[1].toUpperCase() });
  const ticket = text.match(/\b(TKT[- ]?\w+)\b/i);
  if (ticket) entities.push({ type: "ticket_ref", value: ticket[1].toUpperCase() });
  return entities;
}

export function classifyIntent(text: string): NluResult {
  const locale = detectLocale(text);
  const trimmed = text.trim();
  const entities = extractEntities(trimmed);

  // Exact menu digits
  if (/^[0-9]$/.test(trimmed)) {
    const map: Record<string, NluIntent> = {
      "0": "HUMAN_AGENT",
      "1": "DOMAIN_SEARCH",
      "2": "HOSTING",
      "3": "VPS",
      "5": "SOFTWARE",
      "6": "QUOTATION",
      "7": "ORDERS",
      "8": "INVOICES",
      "9": "SUPPORT",
    };
    if (map[trimmed]) {
      return { intent: map[trimmed], confidence: 1, entities, locale };
    }
  }

  const qVec = vectorize(tokenize(trimmed));
  let best: NluIntent = "UNKNOWN";
  let bestScore = 0;

  for (const [intent, phrases] of Object.entries(INTENT_PHRASES) as [NluIntent, string[]][]) {
    if (intent === "UNKNOWN") continue;
    for (const phrase of phrases) {
      const score = cosine(qVec, vectorize(tokenize(phrase)));
      // substring boost
      const boost = trimmed.toLowerCase().includes(phrase) ? 0.35 : 0;
      const total = score + boost;
      if (total > bestScore) {
        bestScore = total;
        best = intent;
      }
    }
  }

  // Entity-informed boosts
  if (entities.some((e) => e.type === "domain") && bestScore < 0.7) {
    best = "DOMAIN_SEARCH";
    bestScore = Math.max(bestScore, 0.75);
  }

  if (bestScore < 0.28) {
    return { intent: "UNKNOWN", confidence: bestScore, entities, locale };
  }

  return {
    intent: best,
    confidence: Math.min(1, bestScore),
    entities,
    locale,
  };
}
