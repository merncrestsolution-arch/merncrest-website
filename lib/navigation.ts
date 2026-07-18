import type React from "react";
import {
  Brain,
  Cloud,
  Code2,
  Globe,
  Megaphone,
  Server,
  Shield,
  Smartphone,
  Briefcase,
  Globe2,
  HardDrive,
  Boxes,
  Palette,
  CloudCog,
  ShieldCheck,
  Mail,
} from "lucide-react";

export interface ServiceMenuItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const serviceMenuItems: ServiceMenuItem[] = [
  { key: "softwareDevelopment", href: "/services/software-development", icon: Code2 },
  { key: "webDevelopment", href: "/services/web-development", icon: Globe },
  { key: "mobileAppDevelopment", href: "/services/mobile-app-development", icon: Smartphone },
  { key: "cloudServices", href: "/cloud", icon: Cloud },
  { key: "cyberSecurity", href: "/services/cyber-security", icon: Shield },
  { key: "aiSolutions", href: "/services/ai-solutions", icon: Brain },
  { key: "digitalMarketing", href: "/services/digital-marketing", icon: Megaphone },
  { key: "itConsulting", href: "/services/it-consulting", icon: Briefcase },
  { key: "hostingDomain", href: "/hosting", icon: Server },
];

export const productMenuItems = [
  { key: "domains", href: "/domains", icon: Globe2 },
  { key: "hosting", href: "/hosting", icon: HardDrive },
  { key: "software", href: "/products/software", icon: Boxes },
  { key: "digital", href: "/products/digital-services", icon: Palette },
  { key: "cloud", href: "/cloud", icon: CloudCog },
  { key: "security", href: "/products/security", icon: ShieldCheck },
  { key: "email", href: "/products/email", icon: Mail },
] as const;

/** Primary desktop nav — Part 02 IA */
export const navLinks = [
  { key: "services", href: "/services" },
  { key: "solutions", href: "/solutions" },
  { key: "products", href: "/products" },
  { key: "industries", href: "/industries" },
  { key: "pricing", href: "/pricing" },
  { key: "portfolio", href: "/portfolio" },
  { key: "support", href: "/support" },
  { key: "contact", href: "/contact" },
] as const;

export const resourceLinks = [
  { key: "about", href: "/about" },
  { key: "knowledgeBase", href: "/knowledge-base" },
  { key: "blog", href: "/blog" },
  { key: "downloads", href: "/downloads" },
  { key: "careers", href: "/careers" },
  { key: "partners", href: "/partners" },
  { key: "team", href: "/team" },
] as const;

export const featuredServiceCards = [
  { title: "Domain Registration", href: "/domains", price: "From LKR 2,500/yr", desc: "Search, register, and manage DNS for .lk, .com, and more." },
  { title: "Web Hosting", href: "/hosting", price: "From LKR 9,900/mo", desc: "Shared and business hosting with SSL and backups." },
  { title: "VPS Hosting", href: "/products/hosting", price: "From LKR 79,900/mo", desc: "Managed VPS with full root control and monitoring." },
  { title: "AWS Cloud", href: "/cloud", price: "Custom", desc: "Deploy, migrate, and secure workloads on AWS." },
  { title: "Website Development", href: "/services/web-development", price: "From LKR 75,000", desc: "Mobile-responsive business and e-commerce sites." },
  { title: "ERP Solutions", href: "/solutions", price: "Custom", desc: "Finance, inventory, and operations in one system." },
  { title: "CRM Solutions", href: "/solutions", price: "Custom", desc: "Leads, tickets, and customer 360 in one profile." },
  { title: "Digital Marketing", href: "/services/digital-marketing", price: "Custom", desc: "SEO, ads, and growth campaigns that convert." },
  { title: "AI Solutions", href: "/services/ai-solutions", price: "Custom", desc: "AI support, automation, and intelligent workflows." },
] as const;
