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
    description: "Search, register, transfer, and manage DNS for .lk, .com, .net, .org, and hundreds of TLDs.",
    items: ["Domain Search", "Registration", "Transfer", "Renewal", "DNS Management"],
  },
  {
    slug: "hosting",
    title: "Hosting",
    description: "Shared, cPanel, business, VPS, cloud, AWS, and managed hosting built for Sri Lankan businesses.",
    items: ["Shared Hosting", "cPanel Hosting", "Business Hosting", "VPS Hosting", "Cloud Hosting", "AWS Hosting", "Managed Hosting"],
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
    title: "Cloud Services",
    description: "AWS deployment, cloud migration, server management, and cloud security.",
    items: ["AWS Deployment", "Cloud Migration", "Server Management", "Cloud Security"],
  },
  {
    slug: "security",
    title: "Security",
    description: "SSL, website protection, backups, firewall, and continuous security monitoring.",
    items: ["SSL", "Website Protection", "Backup", "Firewall", "Security Monitoring"],
  },
  {
    slug: "email",
    title: "Business Email",
    description: "Professional email, Google Workspace, and Microsoft 365 for your organization.",
    items: ["Professional Email", "Google Workspace", "Microsoft 365"],
  },
];

export function getProductCategory(slug: string) {
  return productCategories.find((c) => c.slug === slug);
}
