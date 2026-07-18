import { kbArticles } from "@/lib/data/knowledge-base";

const FAQS: { keys: string[]; answer: string }[] = [
  {
    keys: ["domain", "dns", "nameserver", ".lk", "register"],
    answer:
      "You can search and register domains at /domains. After payment we auto-provision DNS (A, CNAME, MX, TXT). Manage nameservers and lock from Portal → Domains.",
  },
  {
    keys: ["hosting", "cpanel", "vps", "server", "ssl"],
    answer:
      "Hosting packages (Shared, Business, WordPress, VPS, AWS) are under /hosting. After Demo/PayHere payment, accounts activate with SSL and panel access in Portal → Hosting.",
  },
  {
    keys: ["invoice", "pay", "payment", "bill", "refund"],
    answer:
      "Open Portal → Billing to view invoices, pay with PayHere or Demo pay, or download PDF. Refunds can be requested from Portal → Refunds after payment.",
  },
  {
    keys: ["ticket", "support", "help", "issue"],
    answer:
      "Create a ticket in Portal → Support, or ask me to escalate. Agents see tickets in Admin → Support. For urgent issues call customer care or request a callback.",
  },
  {
    keys: ["whatsapp", "chat", "call", "phone", "ivr"],
    answer:
      "WhatsApp: use the green button (wa.me). Live chat is this widget. Phone/IVR callbacks can be requested from Support → Request callback.",
  },
  {
    keys: ["price", "pricing", "cost", "plan"],
    answer:
      "See /pricing for packages. Catalog prices are in LKR. Coupons like WELCOME10 (10%) apply at checkout.",
  },
];

export function aiReply(message: string, locale = "en"): string {
  const q = message.toLowerCase();

  for (const faq of FAQS) {
    if (faq.keys.some((k) => q.includes(k))) {
      return localizeHint(faq.answer, locale);
    }
  }

  const kb = kbArticles.find(
    (a) =>
      q.includes(a.slug.split("-")[0]) ||
      a.title.toLowerCase().split(" ").some((w) => w.length > 4 && q.includes(w))
  );
  if (kb) {
    return localizeHint(`${kb.title}: ${kb.summary} — read more in Knowledge Base.`, locale);
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("vanakkam")) {
    return localizeHint(
      "Hi! I'm MernCrest AI. Ask about domains, hosting, billing, or support — or say “talk to agent” to open a ticket.",
      locale
    );
  }

  if (q.includes("agent") || q.includes("human") || q.includes("escalate")) {
    return localizeHint(
      "I can escalate to a human. Open Portal → Support to create a ticket, or say your issue and I’ll draft one when you’re logged in.",
      locale
    );
  }

  return localizeHint(
    "Thanks for your message. I can help with domains, hosting, invoices, tickets, and WhatsApp care. Try asking “how do I pay an invoice?” or visit /knowledge-base.",
    locale
  );
}

function localizeHint(en: string, locale: string) {
  if (locale === "ta") return `[TA] ${en}`;
  if (locale === "si") return `[SI] ${en}`;
  return en;
}

export function wantsHumanHandoff(message: string) {
  const q = message.toLowerCase();
  return ["agent", "human", "escalate", "operator", "staff"].some((k) => q.includes(k));
}
