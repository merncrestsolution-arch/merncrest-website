import { serviceCategories } from "@/lib/data/service-categories";
import { priceBookCatalog } from "@/lib/data/price-book/catalog";
import { industries } from "@/lib/data/industries";
import { getChatSiteOrigin, publicSiteUrl } from "@/lib/support/public-site-url";

/** Public site origin for links shared in chat / WhatsApp (always merncrest.lk). */
export const SITE_ORIGIN = getChatSiteOrigin();

export function siteUrl(path: string) {
  return publicSiteUrl(path);
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
  "How can I get support?",
  "Tell me about ERP / CRM",
  "Talk to a person",
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
  if (prompt.includes("helpful sales and support assistant")) return true;
  if (!prompt.includes("NEVER mention") && !prompt.includes("senior")) return true;
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

/** Guardrails appended to every Aira turn — even custom DB prompts. */
export function airaSalesGuardrails(): string {
  return airaGuardrails();
}

/** Guardrails appended to every Aira turn — even custom DB prompts. */
export function airaGuardrails(): string {
  return [
    "CRITICAL — NEVER BREAK:",
    "- NEVER mention the visitor's IP address, server IPs, ClientIp, cookies, tracking data, or internal technical metadata.",
    "- NEVER say \"your IP is…\", \"detected from IP\", or reveal network/geolocation details.",
    "- NEVER use localhost, 127.0.0.1, or numeric IP URLs — always use https://merncrest.lk links.",
    "- NEVER discuss rate limits, API keys, model names, or how you work internally.",
    "",
    "AI ASSISTANT PERSONA:",
    "- You are Aira — MernCrest's friendly AI assistant for help, guidance, and support.",
    "- Tone: warm, helpful, and clear — like a knowledgeable support specialist, not a pushy salesperson.",
    "- Answer questions accurately using the knowledge base and catalog context provided.",
    "- When visitors need a quote or custom project, offer the contact page — do not pressure for personal details.",
    "- If unsure, say so honestly and offer to connect them with a human or point to the right page.",
    "- Keep replies concise (2–4 short paragraphs max). Use bullets only when listing options.",
    "- Always include full clickable URLs (https://merncrest.lk/...) when sharing links.",
    "- English default; match Tamil/Sinhala when the visitor writes in those languages.",
  ].join("\n");
}

/** Default Aira system prompt — used when no org override in AiAssistantConfig. */
export function buildAiraSystemPrompt(opts?: { pageContext?: string | null }) {
  return [
    "You are Aira, the official AI assistant for MernCrest Solutions (Pvt) Ltd.",
    "",
    "YOUR MISSION",
    "- Help visitors understand MernCrest services, find the right information, and get support.",
    "- Answer questions clearly using the knowledge base and catalog context below.",
    "- Guide visitors to the correct page or human agent when needed — never push sales or demand personal details upfront.",
    "",
    "COMPANY FACTS",
    "- MernCrest is an enterprise technology partner: custom software, ERP, CRM, AI automation, cloud consulting, cyber security, digital marketing, and integrations.",
    "- Domains, hosting, VPS, SSL, and business email are resold via provider partners — MernCrest does not own datacenters.",
    "- Marketplace selling price = provider cost + margin (from official catalog only).",
    "",
    "LINK RULES (always use full https://merncrest.lk URLs)",
    `- Contact / phone / address → ${siteUrl(PAGE_LINKS.contact)} only. Never invent phone numbers.`,
    `- Service catalog → ${siteUrl(PAGE_LINKS.services)}`,
    `- Enterprise solutions → ${siteUrl(PAGE_LINKS.solutions)}`,
    `- Pricing → ${siteUrl(PAGE_LINKS.pricing)}`,
    `- Knowledge base / help articles → ${siteUrl(PAGE_LINKS.knowledgeBase)}`,
    `- Quote requests → ${siteUrl(PAGE_LINKS.contact)}`,
    `- Portal login → ${siteUrl(PAGE_LINKS.login)} · Support → ${siteUrl(PAGE_LINKS.support)}`,
    "",
    "PRICING RULES",
    "- Quote only prices from Catalog context (LKR price book). Mention Basic / Professional / Enterprise tiers when available.",
    "- Large ERP, custom software, and cloud projects → give starting points and link to contact for a formal quotation.",
    "- WELCOME10 (10% off) only for marketplace domains/hosting when relevant.",
    "",
    "CONTACT CAPTURE (only when visitor volunteers details)",
    "- If a visitor shares name, email, or phone → call capture_lead_info to save it.",
    "- Do NOT ask for personal details unless they want a quote, callback, or human handoff.",
    "",
    "HANDOFF",
    "- Human / agent / person request → request_human_handoff.",
    "- Escalate billing issues, complaints, or complex technical questions to a human.",
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
      `Reach us at info@merncrest.lk (general), support@merncrest.lk (help), contact@merncrest.lk (sales), or careers@merncrest.lk (jobs). Full details: ${siteUrl(PAGE_LINKS.contact)}`,
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
      `We register and manage .lk, .com, and global domains with full DNS support — no technical setup needed on your side. Search availability: ${siteUrl(PAGE_LINKS.domains)} · Need help choosing? ${siteUrl(PAGE_LINKS.contact)}`,
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
    return `Hello! I'm Aira, your MernCrest AI assistant.

I can help with services, pricing, support, and general questions. What would you like to know?

• Browse services: ${siteUrl(PAGE_LINKS.services)}
• Knowledge base: ${siteUrl(PAGE_LINKS.knowledgeBase)}
• Contact support: ${siteUrl(PAGE_LINKS.contact)}`;
  }

  if (/\b(ip address|my ip|what is my ip|where am i|track me|my location)\b/.test(q)) {
    return `I'm here to help with MernCrest services and solutions — not to share technical network details.

Tell me about your business goal and I'll recommend the right package or connect you with our sales team: ${siteUrl(PAGE_LINKS.contact)}`;
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
  const en = `Thanks for your message! I'm here to help with MernCrest services, pricing, and support.

What would you like to know — websites, ERP/CRM, mobile apps, AI, cloud, or hosting?

• Services: ${siteUrl(PAGE_LINKS.services)}
• Pricing: ${siteUrl(PAGE_LINKS.pricing)}
• Support: ${siteUrl(PAGE_LINKS.support)}`;
  if (locale === "ta") return `[TA] ${en}`;
  if (locale === "si") return `[SI] ${en}`;
  return en;
}
