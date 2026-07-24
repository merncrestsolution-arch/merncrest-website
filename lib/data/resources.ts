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

export type Partner = {
  name: string;
  slug: string;
  color: string;
  role: string;
  category: "Cloud" | "Productivity" | "Security" | "Hosting" | "SSL";
  blurb: string;
  image?: string;
};

export const partners: Partner[] = [
  {
    name: "AWS",
    slug: "amazonaws",
    color: "FF9900",
    role: "Cloud infrastructure we build on",
    category: "Cloud",
    blurb: "We deploy, migrate, and operate production workloads on Amazon Web Services.",
  },
  {
    name: "Google Cloud",
    slug: "googlecloud",
    color: "4285F4",
    role: "Cloud infrastructure we build on",
    category: "Cloud",
    blurb: "Scalable infrastructure, AI APIs, and managed Kubernetes for modern apps.",
  },
  {
    name: "Microsoft 365",
    slug: "microsoft",
    color: "00A4EF",
    role: "Productivity tools we integrate",
    category: "Productivity",
    blurb: "Enterprise identity, collaboration, and productivity for hybrid teams.",
  },
  {
    name: "Google Workspace",
    slug: "google",
    color: "4285F4",
    role: "Business email we resell",
    category: "Productivity",
    blurb: "Business email and collaboration suites provisioned through provider APIs.",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    color: "F38020",
    role: "Edge & security we use",
    category: "Security",
    blurb: "Global CDN, DNS, WAF, and edge security for high-availability delivery.",
  },
  {
    name: "Let's Encrypt",
    slug: "letsencrypt",
    color: "003A70",
    role: "SSL certificates we provision",
    category: "SSL",
    blurb: "Automated certificate issuance for secure HTTPS across customer domains.",
  },
  {
    name: "cPanel",
    slug: "cpanel",
    color: "FF6C2C",
    role: "Hosting control panel we resell",
    category: "Hosting",
    blurb: "Industry-standard hosting panels powering reseller provisioning flows.",
  },
  {
    name: "Docker",
    slug: "docker",
    color: "2496ED",
    role: "DevOps tooling we use",
    category: "Cloud",
    blurb: "Containerized delivery pipelines for consistent cloud and VPS deployments.",
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
