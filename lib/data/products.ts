export type ProductCategory = {
  slug: string;
  title: string;
  description: string;
  items: string[];
};

export const productCategories: ProductCategory[] = [
  {
    slug: "domains",
    title: "Domains",
    description: "Search, register, transfer, and manage DNS via our reseller provider network (.lk, .com, and more).",
    items: ["Domain Search", "Registration", "Transfer", "Renewal", "DNS Management"],
  },
  {
    slug: "hosting",
    title: "Hosting",
    description: "Shared, cPanel, business, VPS, and cloud hosting packages synchronized from provider partners — not MernCrest-owned servers.",
    items: ["Shared Hosting", "cPanel Hosting", "Business Hosting", "VPS Hosting", "Cloud Hosting", "Managed Hosting"],
  },
  {
    slug: "software",
    title: "Software",
    description: "Business websites, e-commerce, ERP, CRM, POS, HR systems, and custom enterprise applications.",
    items: ["Business Websites", "E-Commerce", "ERP", "CRM", "POS", "HR Systems", "Custom Enterprise Software"],
  },
  {
    slug: "digital-services",
    title: "Digital Services",
    description: "UI/UX, branding, SEO, and digital marketing to launch and grow your brand.",
    items: ["UI/UX Design", "Logo Design", "Branding", "SEO", "Digital Marketing"],
  },
  {
    slug: "cloud",
    title: "Cloud Consulting",
    description: "AWS deployment, cloud migration, architecture consulting, and cloud security advisory.",
    items: ["AWS Deployment", "Cloud Migration", "Cloud Consulting", "Cloud Security"],
  },
  {
    slug: "security",
    title: "Security",
    description: "SSL certificates and security add-ons resold through provider partners, plus protection consulting.",
    items: ["SSL", "Website Protection", "Backup", "Firewall", "Security Monitoring"],
  },
  {
    slug: "email",
    title: "Business Email",
    description: "Professional email, Google Workspace, and Microsoft 365 — provisioned via provider APIs.",
    items: ["Professional Email", "Google Workspace", "Microsoft 365"],
  },
];

export function getProductCategory(slug: string) {
  return productCategories.find((c) => c.slug === slug);
}
