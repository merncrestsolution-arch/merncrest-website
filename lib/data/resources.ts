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
  {
    name: "AWS",
    slug: "amazonaws",
    color: "FF9900",
    role: "Cloud Partner",
    blurb: "Deployment, migration, and managed AWS workloads.",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Google Workspace",
    slug: "google",
    color: "4285F4",
    role: "Productivity",
    blurb: "Business email and collaboration for teams.",
    image:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Microsoft 365",
    slug: "microsoft",
    color: "00A4EF",
    role: "Productivity",
    blurb: "Enterprise productivity and identity.",
    image:
      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    color: "F38020",
    role: "Edge & Security",
    blurb: "CDN, DNS, and edge security.",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Let's Encrypt",
    slug: "letsencrypt",
    color: "003A70",
    role: "SSL",
    blurb: "Automated certificate issuance.",
  },
  {
    name: "cPanel",
    slug: "cpanel",
    color: "FF6C2C",
    role: "Hosting",
    blurb: "Industry-standard hosting control panels.",
  },
];

/** Shared tech brand strip for cloud / technologies pages */
export const techBrands = [
  { name: "AWS", slug: "amazonaws", color: "FF9900" },
  { name: "Microsoft", slug: "microsoft", color: "00A4EF" },
  { name: "Google Cloud", slug: "googlecloud", color: "4285F4" },
  { name: "Docker", slug: "docker", color: "2496ED" },
  { name: "Kubernetes", slug: "kubernetes", color: "326CE5" },
  { name: "React", slug: "react", color: "61DAFB" },
  { name: "Next.js", slug: "nextdotjs", color: "white" },
  { name: "Node.js", slug: "nodedotjs", color: "339933" },
];
