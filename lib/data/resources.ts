export type DownloadItem = {
  slug: string;
  title: string;
  category: string;
  description: string;
  fileType: string;
};

export const downloads: DownloadItem[] = [
  { slug: "company-profile", title: "Company Profile", category: "Company", description: "Overview of MernCrest Solutions Pvt Ltd.", fileType: "PDF" },
  { slug: "service-catalog", title: "Service Catalog", category: "Services", description: "Domains, hosting, cloud, and enterprise offerings.", fileType: "PDF" },
  { slug: "enterprise-brochure", title: "Enterprise Brochure", category: "Enterprise", description: "ERP, CRM, and digital transformation overview.", fileType: "PDF" },
  { slug: "hosting-guide", title: "Hosting Buyer Guide", category: "Guides", description: "Choose shared, VPS, or cloud hosting.", fileType: "PDF" },
  { slug: "security-whitepaper", title: "Security Whitepaper", category: "Security", description: "Platform security controls and best practices.", fileType: "PDF" },
  { slug: "case-studies-pack", title: "Case Studies Pack", category: "Case Studies", description: "Selected customer success stories.", fileType: "PDF" },
];

export const partners = [
  { name: "AWS", role: "Cloud Partner", blurb: "Deployment, migration, and managed AWS workloads." },
  { name: "Google Workspace", role: "Productivity", blurb: "Business email and collaboration for teams." },
  { name: "Microsoft 365", role: "Productivity", blurb: "Enterprise productivity and identity." },
  { name: "Cloudflare", role: "Edge & Security", blurb: "CDN, DNS, and edge security." },
  { name: "Let's Encrypt", role: "SSL", blurb: "Automated certificate issuance." },
  { name: "cPanel", role: "Hosting", blurb: "Industry-standard hosting control panels." },
];
