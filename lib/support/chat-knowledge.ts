import { serviceCategories } from "@/lib/data/service-categories";
import { priceBookCatalog } from "@/lib/data/price-book/catalog";
import { industries } from "@/lib/data/industries";

/** Public site origin for links shared in chat / WhatsApp. */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk"
).replace(/\/$/, "");

export function siteUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

/** Key pages Aira should link visitors to. */
export const PAGE_LINKS = {
  home: "/",
  contact: "/contact",
  services: "/services",
  solutions: "/solutions",
  pricing: "/pricing",
  industries: "/industries",
  portfolio: "/portfolio",
  support: "/support",
  domains: "/domains",
  hosting: "/hosting",
  login: "/login",
  careers: "/careers",
  knowledgeBase: "/knowledge-base",
  quote: "/contact",
} as const;

export const CHAT_QUICK_REPLIES = [
  "What services do you offer?",
  "Website pricing",
  "ERP / CRM solutions",
  "Talk to sales",
] as const;

const SERVICE_ROUTES: { keys: string[]; path: string; label: string }[] = [
  { keys: ["erp", "enterprise resource"], path: "/solutions/erp", label: "ERP" },
  { keys: ["crm", "customer relationship"], path: "/solutions/crm", label: "CRM" },
  { keys: ["pos", "point of sale", "billing"], path: "/solutions/pos", label: "POS" },
  { keys: ["iot", "industrial", "smart factory"], path: "/solutions/iot", label: "IoT" },
  { keys: ["healthcare", "hospital", "clinic"], path: "/solutions/healthcare", label: "Healthcare" },
  { keys: ["education", "school", "lms"], path: "/solutions/education", label: "Education" },
  { keys: ["hotel", "restaurant", "hospitality", "booking"], path: "/solutions/booking", label: "Hospitality" },
  { keys: ["logistics", "fleet", "warehouse"], path: "/solutions/logistics", label: "Logistics" },
  { keys: ["fintech", "finance app"], path: "/solutions/fintech", label: "FinTech" },
  { keys: ["ecommerce", "e-commerce", "online store"], path: "/solutions/ecommerce", label: "E-Commerce" },
  { keys: ["website", "web development", "landing page"], path: "/services/websites", label: "Websites" },
  { keys: ["mobile app", "android", "ios"], path: "/services/mobile-app-development", label: "Mobile Apps" },
  { keys: ["software development", "custom software", "web app"], path: "/services/software-development", label: "Custom Software" },
  { keys: ["ai", "chatbot", "automation", "machine learning"], path: "/services/ai-solutions", label: "AI Solutions" },
  { keys: ["cloud", "aws", "devops", "kubernetes"], path: "/cloud", label: "Cloud" },
  { keys: ["security", "cyber", "penetration", "firewall"], path: "/services/cyber-security", label: "Cyber Security" },
  { keys: ["marketing", "seo", "google ads", "social media"], path: "/services/digital-marketing", label: "Digital Marketing" },
  { keys: ["branding", "ui", "ux", "logo", "design"], path: "/services/branding", label: "Branding & Design" },
  { keys: ["consulting", "digital transformation"], path: "/services/it-consulting", label: "IT Consulting" },
  { keys: ["domain"], path: "/domains", label: "Domains" },
  { keys: ["hosting", "vps", "ssl", "email hosting"], path: "/hosting", label: "Hosting" },
  { keys: ["training", "internship", "academy"], path: "/careers", label: "Training & Careers" },
  { keys: ["support", "amc", "maintenance contract"], path: "/support", label: "Support & AMC" },
];

/** Compact service + industry lines for LLM context. */
export function buildServiceKnowledgeContext(): string {
  const lines: string[] = [
    "=== MERNCREST SERVICES (what we do) ===",
    "Company: MernCrest Solutions (Pvt) Ltd — enterprise technology, software development, AI, cloud consulting, and digital transformation. Domains/hosting are resold via provider partners (we do not own datacenters).",
    "",
    "Service categories:",
  ];

  for (const cat of serviceCategories) {
    lines.push(`• ${cat.title}: ${cat.summary}`);
    const samples = cat.items.slice(0, 4).map((i) => i.title).join("; ");
    lines.push(`  Examples: ${samples}${cat.items.length > 4 ? "; …" : ""}`);
  }

  lines.push("", "Price book volumes (detail pages):");
  for (const vol of priceBookCatalog) {
    lines.push(`• ${vol.title} → ${siteUrl(vol.href)} — ${vol.summary}`);
  }

  lines.push("", "Industries we serve:");
  for (const ind of industries) {
    lines.push(`• ${ind.title}: ${ind.description}`);
  }

  lines.push(
    "",
    "Key links:",
    `• All services: ${siteUrl(PAGE_LINKS.services)}`,
    `• Enterprise solutions: ${siteUrl(PAGE_LINKS.solutions)}`,
    `• Pricing overview: ${siteUrl(PAGE_LINKS.pricing)}`,
    `• Contact / phone / address: ${siteUrl(PAGE_LINKS.contact)}`,
    `• Get a quote: ${siteUrl(PAGE_LINKS.contact)}`,
    `• Client portal login: ${siteUrl(PAGE_LINKS.login)}`
  );

  return lines.join("\n");
}

/** True when DB prompt is the old short default — replace with full trained prompt. */
export function isLegacyAiraPrompt(prompt: string | null | undefined) {
  if (!prompt?.trim()) return true;
  if (prompt.length < 400) return true;
  return (
    prompt.includes("helpful sales and support assistant") &&
    !prompt.includes("LINK RULES")
  );
}

export function resolveAiraSystemPrompt(
  assistantPrompt: string | null | undefined,
  opts?: { pageContext?: string | null }
) {
  if (isLegacyAiraPrompt(assistantPrompt)) {
    return buildAiraSystemPrompt(opts);
  }
  return assistantPrompt!.trim();
}

/** Default Aira system prompt — used when no org override in AiAssistantConfig. */
export function buildAiraSystemPrompt(opts?: { pageContext?: string | null }) {
  return [
    "You are Aira, the official AI sales and support assistant for MernCrest Solutions (Pvt) Ltd.",
    "",
    "YOUR ROLE",
    "- Help visitors understand what MernCrest does, recommend the right service, share accurate pricing from the catalog context, answer logical follow-up questions, and guide prospective clients to become leads.",
    "- Be warm, professional, and concise. Use short paragraphs and bullet lists when helpful.",
    "- Reply in English by default; if the user writes Tamil or Sinhala, respond in that language when you can.",
    "",
    "COMPANY FACTS",
    "- MernCrest is primarily an enterprise technology company: custom software, ERP, CRM, AI, cloud consulting, cyber security, digital marketing, and integrations.",
    "- Domains, hosting, VPS, SSL, and business email are sold through a reseller marketplace (provider APIs) — MernCrest does not own hosting servers or datacenters.",
    "- Selling price for marketplace items = provider cost + configurable margin.",
    "",
    "LINK RULES (always use full URLs)",
    `- Contact, phone number, address, or \"how to reach you\" → send ${siteUrl(PAGE_LINKS.contact)} only. Do NOT invent or guess phone numbers in chat — the contact page has official details.`,
    `- Full service catalog → ${siteUrl(PAGE_LINKS.services)}`,
    `- Enterprise ERP/CRM/operations → ${siteUrl(PAGE_LINKS.solutions)}`,
    `- Pricing overview → ${siteUrl(PAGE_LINKS.pricing)}`,
    `- Request quote / become a client → ${siteUrl(PAGE_LINKS.contact)} and offer to capture their details in chat`,
    `- Existing customers: portal login → ${siteUrl(PAGE_LINKS.login)}, support tickets → ${siteUrl(PAGE_LINKS.support)}`,
    "- When discussing a specific service, include the most relevant page link from the service knowledge below.",
    "",
    "PRICING RULES",
    "- Only quote prices that appear in the Catalog context (official LKR price book). Give tier names (Basic / Professional / Enterprise) when available.",
    "- ERP, large custom software, and cloud projects are often custom — give price book starting points then suggest a quotation.",
    "- Never invent discounts unless WELCOME10 (10% marketplace coupon) is relevant for domains/hosting checkout.",
    "",
    "LEAD CAPTURE (important)",
    "- When someone wants a quote, demo, consultation, or to become a client: ask for name, email, phone, company (optional), and what they need.",
    "- As soon as they share contact info, call capture_lead_info with whatever fields you have.",
    "- When budget, timeline, and need are clear, call flag_qualified_lead.",
    "- After capturing a lead, send the best matching service page link and ${siteUrl(PAGE_LINKS.contact)} for formal quotes.",
    "",
    "HANDOFF",
    "- If they ask for a human, agent, or sales person, call request_human_handoff.",
    "- Escalate complex technical scoping, legal, or complaints to a human.",
    "",
    "SAMPLE STARTER QUESTIONS YOU CAN ASK",
    "- What type of business are you in?",
    "- Do you need a website, mobile app, ERP/CRM, AI automation, cloud, or hosting?",
    "- What is your timeline and approximate budget?",
    "",
    opts?.pageContext ? `Visitor is currently on page: ${opts.pageContext}` : "",
    "",
    buildServiceKnowledgeContext(),
  ]
    .filter(Boolean)
    .join("\n");
}

function findServiceLink(query: string): { path: string; label: string } | null {
  const q = query.toLowerCase();
  for (const route of SERVICE_ROUTES) {
    if (route.keys.some((k) => q.includes(k))) {
      return { path: route.path, label: route.label };
    }
  }
  return null;
}

type FaqEntry = { keys: string[]; answer: string | ((q: string) => string) };

const FAQ_ENTRIES: FaqEntry[] = [
  {
    keys: ["contact", "phone", "number", "call", "whatsapp", "email", "address", "location", "reach you", "reach us"],
    answer: () =>
      `For our official contact details, phone, and address, please visit ${siteUrl(PAGE_LINKS.contact)} — our team will respond promptly.`,
  },
  {
    keys: ["what do you do", "what services", "services offer", "what can you", "who is merncrest", "about merncrest", "company do"],
    answer: () =>
      `MernCrest Solutions is an enterprise technology partner — custom software, ERP, CRM, AI automation, cloud, cyber security, digital marketing, and more. Browse our full catalog: ${siteUrl(PAGE_LINKS.services)}`,
  },
  {
    keys: ["price", "pricing", "cost", "how much", "package", "rate", "quote", "quotation"],
    answer: (q) => {
      const link = findServiceLink(q);
      if (link) {
        return `Pricing depends on scope and tier. See our ${link.label} packages at ${siteUrl(link.path)} or request a custom quote at ${siteUrl(PAGE_LINKS.contact)}. You can also check ${siteUrl(PAGE_LINKS.pricing)} for an overview.`;
      }
      return `We publish starting prices in our service pages and price book. Visit ${siteUrl(PAGE_LINKS.pricing)} or tell me what you need (website, ERP, mobile app, hosting, etc.) and I'll point you to the right packages. For a formal quote: ${siteUrl(PAGE_LINKS.contact)}`;
    },
  },
  {
    keys: ["erp"],
    answer: () =>
      `We build modular ERP — finance, inventory, HRM, manufacturing, procurement, and more. Learn more: ${siteUrl("/solutions/erp")} · Full enterprise stack: ${siteUrl(PAGE_LINKS.solutions)} · Get a quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["crm"],
    answer: () =>
      `Our CRM covers leads, pipelines, meetings, quotations, and customer 360 — integrated with WhatsApp, chat, and tickets. ${siteUrl("/solutions/crm")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["website", "web development", "landing page", "ecommerce", "e-commerce"],
    answer: () =>
      `We build corporate sites, business websites, e-commerce, and landing pages from LKR 20,000+. Packages: ${siteUrl("/services/websites")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["mobile app", "android", "ios"],
    answer: () =>
      `We develop native and cross-platform mobile apps for Android and iOS. Details: ${siteUrl("/services/mobile-app-development")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["ai", "chatbot", "automation"],
    answer: () =>
      `We implement AI chatbots, document processing, workflow automation, and CRM intelligence. ${siteUrl("/services/ai-solutions")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["cloud", "aws", "devops", "migration"],
    answer: () =>
      `We provide AWS cloud architecture, migration, DevOps, and managed infrastructure. ${siteUrl("/cloud")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["domain", "dns", ".lk", "register domain"],
    answer: () =>
      `Search and register domains at ${siteUrl(PAGE_LINKS.domains)}. After admin-verified payment we provision via our provider partners.`,
  },
  {
    keys: ["hosting", "vps", "cpanel", "ssl"],
    answer: () =>
      `Hosting and VPS are resold through trusted provider partners. Browse plans: ${siteUrl(PAGE_LINKS.hosting)} · Domains: ${siteUrl(PAGE_LINKS.domains)}`,
  },
  {
    keys: ["invoice", "pay", "payment", "bill", "refund"],
    answer: () =>
      `Log in to the client portal for invoices and manual bank-transfer payments. Portal: ${siteUrl(PAGE_LINKS.login)} · Support: ${siteUrl(PAGE_LINKS.support)}`,
  },
  {
    keys: ["ticket", "support", "issue", "problem", "not working"],
    answer: () =>
      `Create a support ticket in the portal or visit ${siteUrl(PAGE_LINKS.support)}. For urgent help, use ${siteUrl(PAGE_LINKS.contact)}.`,
  },
  {
    keys: ["client", "customer", "sign up", "register", "get started", "hire", "work with you", "become a client"],
    answer: () =>
      `We'd love to work with you! Share your name, email, phone, and project brief here — or submit a request at ${siteUrl(PAGE_LINKS.contact)}. Browse services: ${siteUrl(PAGE_LINKS.services)}`,
  },
  {
    keys: ["industr"],
    answer: () =>
      `We serve manufacturing, healthcare, education, retail, logistics, hospitality, finance, government, NGOs, and more. ${siteUrl(PAGE_LINKS.industries)}`,
  },
  {
    keys: ["training", "internship", "course", "academy"],
    answer: () =>
      `We offer corporate IT training, development courses, cloud/AI workshops, and internships. ${siteUrl(PAGE_LINKS.careers)}`,
  },
  {
    keys: ["marketing", "seo", "google ads", "social media"],
    answer: () =>
      `We provide SEO, paid ads, social media, email, and content marketing. ${siteUrl("/services/digital-marketing")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
  {
    keys: ["security", "cyber", "hack", "penetration"],
    answer: () =>
      `We offer security assessments, penetration testing, hardening, and monitoring. ${siteUrl("/services/cyber-security")} · Quote: ${siteUrl(PAGE_LINKS.contact)}`,
  },
];

const GREETING_RE =
  /^(hi|hello|hey|good\s*(morning|afternoon|evening)|vanakkam|ayubowan|howdy)\b|^(hi|hello)\s*[!.,]?\s*$/i;

/** Rule-based reply when LLM is unavailable or as enrichment. Returns null if no match. */
export function matchChatKnowledge(message: string): string | null {
  const q = message.trim().toLowerCase();
  if (!q) return null;

  if (GREETING_RE.test(q)) {
    return `Hi! I'm Aira, MernCrest's AI assistant. I can explain our services, share pricing guidance, and help you get a quote.

What are you looking for — website, ERP/CRM, mobile app, AI, cloud, hosting, or something else?

• All services: ${siteUrl(PAGE_LINKS.services)}
• Contact us: ${siteUrl(PAGE_LINKS.contact)}`;
  }

  if (/\b(agent|human|person|operator|sales team|talk to someone|speak to someone)\b/.test(q)) {
    return `I'll connect you with our team. You can also reach us directly at ${siteUrl(PAGE_LINKS.contact)} or say what you need and I'll capture your details for a callback.`;
  }

  for (const faq of FAQ_ENTRIES) {
    if (faq.keys.some((k) => q.includes(k))) {
      return typeof faq.answer === "function" ? faq.answer(q) : faq.answer;
    }
  }

  const serviceLink = findServiceLink(q);
  if (serviceLink) {
    return `We offer ${serviceLink.label} solutions tailored to your business. Learn more: ${siteUrl(serviceLink.path)} · Request a quote: ${siteUrl(PAGE_LINKS.contact)}`;
  }

  return null;
}

export function defaultChatFallback(locale = "en"): string {
  const en = `Thanks for your message! I can help with MernCrest services, pricing, and getting you a quote.

• Services: ${siteUrl(PAGE_LINKS.services)}
• Pricing: ${siteUrl(PAGE_LINKS.pricing)}
• Contact: ${siteUrl(PAGE_LINKS.contact)}

Tell me what you're building (website, ERP, app, AI, cloud, hosting…) and I'll guide you.`;
  if (locale === "ta") return `[TA] ${en}`;
  if (locale === "si") return `[SI] ${en}`;
  return en;
}
