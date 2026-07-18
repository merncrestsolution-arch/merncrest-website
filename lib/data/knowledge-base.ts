export type KbArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string[];
};

export const kbArticles: KbArticle[] = [
  {
    slug: "getting-started-portal",
    title: "Getting started with the Customer Portal",
    category: "Tutorials",
    summary: "Create your account, verify email, and manage all services from one place.",
    body: [
      "Register with your business email and verify the confirmation link.",
      "Complete your profile with company and billing details.",
      "From Overview you can jump to Orders, Domains, Hosting, Invoices, and Tickets.",
      "One account manages every MernCrest service you purchase.",
    ],
  },
  {
    slug: "domain-dns-basics",
    title: "Domain & DNS basics",
    category: "Documentation",
    summary: "Understand nameservers, A records, and how DNS points to your hosting.",
    body: [
      "After registration, set nameservers to MernCrest DNS or your preferred provider.",
      "An A record maps your domain to a server IP address.",
      "CNAME records alias subdomains such as www to your primary host.",
      "DNS changes can take minutes to 48 hours to propagate globally.",
    ],
  },
  {
    slug: "ssl-and-https",
    title: "Enabling SSL and HTTPS",
    category: "Tutorials",
    summary: "Secure your site with Let's Encrypt or commercial SSL certificates.",
    body: [
      "Most managed hosting plans include free Let's Encrypt SSL.",
      "Force HTTPS redirects once the certificate is active.",
      "Renewals are automatic on managed plans; monitor expiry on Status views.",
    ],
  },
  {
    slug: "create-support-ticket",
    title: "How to create a support ticket",
    category: "FAQs",
    summary: "Open tickets from the portal, live chat, or WhatsApp — all sync to CRM.",
    body: [
      "Go to Portal → Tickets → New Ticket and choose a department.",
      "Attach screenshots or logs when reporting technical issues.",
      "You will receive email and in-portal updates as agents respond.",
    ],
  },
  {
    slug: "invoice-payments",
    title: "Invoices and payment reminders",
    category: "Documentation",
    summary: "View invoices, pay online, and understand renewal reminders.",
    body: [
      "Invoices appear under Portal → Invoices with status and due dates.",
      "Renewal reminders are sent before domains and hosting expire.",
      "Contact Billing if you need a tax invoice or payment extension.",
    ],
  },
  {
    slug: "vps-resource-monitoring",
    title: "Reading VPS resource graphs",
    category: "Troubleshooting",
    summary: "CPU, RAM, disk, bandwidth, uptime, backup, and SSL status explained.",
    body: [
      "Sustained high CPU may indicate a runaway process or traffic spike.",
      "Disk alerts should be addressed before backups fail.",
      "SSL and domain expiry widgets help prevent unexpected downtime.",
    ],
  },
];

export const kbCategories = ["Tutorials", "Documentation", "FAQs", "Troubleshooting", "Video Guides"] as const;

export function getKbArticle(slug: string) {
  return kbArticles.find((a) => a.slug === slug);
}
