import type { PriceBookVolume } from "./types";
import { volume01Branding } from "./volume-01-branding";
import { volume02Websites } from "./volume-02-websites";
import { volume03Mobile } from "./volume-03-mobile";
import { volume04Pos } from "./volume-04-pos";
import { volume05Erp } from "./volume-05-erp";
import { volume06BusinessSystems } from "./volume-06-business-systems";
import { volume07Ai } from "./volume-07-ai";
import { volume08Cloud } from "./volume-08-cloud";
import { volume09Marketing } from "./volume-09-marketing";
import { volume10Support } from "./volume-10-support";

export type PriceBookCatalogEntry = {
  volume: number;
  slug: string;
  title: string;
  href: string;
  summary: string;
};

export const priceBookCatalog: PriceBookCatalogEntry[] = [
  {
    volume: 1,
    slug: "branding",
    title: "Branding & Creative Solutions",
    href: "/services/branding",
    summary: "UI/UX design, social media branding, presentations, and brand guidelines.",
  },
  {
    volume: 2,
    slug: "websites",
    title: "Website Development & Web Solutions",
    href: "/services/websites",
    summary: "Landing pages, business sites, e-commerce, portals, and custom web applications.",
  },
  {
    volume: 3,
    slug: "mobile-apps",
    title: "Mobile Application Development",
    href: "/services/mobile-apps",
    summary: "Android, iOS, cross-platform, and enterprise mobile applications.",
  },
  {
    volume: 4,
    slug: "pos",
    title: "POS Systems & Billing Solutions",
    href: "/services/pos",
    summary: "Retail, restaurant, pharmacy, supermarket, and enterprise POS systems.",
  },
  {
    volume: 5,
    slug: "erp",
    title: "ERP & Enterprise Resource Planning",
    href: "/services/erp",
    summary: "Sales, manufacturing, distribution, finance, HRM, and digital transformation ERP.",
  },
  {
    volume: 6,
    slug: "business-systems",
    title: "Business Management Systems",
    href: "/services/business-systems",
    summary: "CRM, HRM, payroll, inventory, fleet, projects, and enterprise business suites.",
  },
  {
    volume: 7,
    slug: "ai-automation",
    title: "AI Solutions & Business Automation",
    href: "/services/ai-automation",
    summary: "AI chatbots, WhatsApp automation, voice AI, OCR, and enterprise AI platforms.",
  },
  {
    volume: 8,
    slug: "cloud-infrastructure",
    title: "Cloud Infrastructure, DevOps & Cybersecurity",
    href: "/services/cloud-infrastructure",
    summary: "AWS, Azure, GCP, DevOps, Kubernetes, cloud security, and managed infrastructure.",
  },
  {
    volume: 9,
    slug: "marketing",
    title: "Digital Marketing, Branding & Creative Media",
    href: "/services/marketing",
    summary: "SEO, paid ads, social media, content, branding, video, and growth retainers.",
  },
  {
    volume: 10,
    slug: "enterprise-support",
    title: "Enterprise Support, Managed Services & AMC",
    href: "/services/enterprise-support",
    summary: "AMC, managed IT, monitoring, disaster recovery, training, and SLA programs.",
  },
];

export const priceBookVolumesById: Record<string, PriceBookVolume> = {
  [volume01Branding.id]: volume01Branding,
  [volume02Websites.id]: volume02Websites,
  [volume03Mobile.id]: volume03Mobile,
  [volume04Pos.id]: volume04Pos,
  [volume05Erp.id]: volume05Erp,
  [volume06BusinessSystems.id]: volume06BusinessSystems,
  [volume07Ai.id]: volume07Ai,
  [volume08Cloud.id]: volume08Cloud,
  [volume09Marketing.id]: volume09Marketing,
  [volume10Support.id]: volume10Support,
};

export const priceBookExecutiveSummary =
  "This 10-volume catalog provides a comprehensive portfolio of over 200 technology and digital services, covering the full lifecycle of business transformation—from branding and websites to enterprise software, AI, cloud infrastructure, cybersecurity, digital marketing, and long-term support. It is designed to serve as a standard commercial reference for quotations, proposals, sales presentations, website service pages, and enterprise client engagements.";
