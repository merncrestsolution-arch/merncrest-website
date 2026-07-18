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
  { key: "cloudServices", href: "/services/cloud-services", icon: Cloud },
  { key: "cyberSecurity", href: "/services/cyber-security", icon: Shield },
  { key: "aiSolutions", href: "/services/ai-solutions", icon: Brain },
  { key: "digitalMarketing", href: "/services/digital-marketing", icon: Megaphone },
  { key: "itConsulting", href: "/services/it-consulting", icon: Briefcase },
  { key: "hostingDomain", href: "/services/hosting-domain", icon: Server },
];

export const productMenuItems = [
  { key: "domains", href: "/products/domains", icon: Globe2 },
  { key: "hosting", href: "/products/hosting", icon: HardDrive },
  { key: "software", href: "/products/software", icon: Boxes },
  { key: "digital", href: "/products/digital-services", icon: Palette },
  { key: "cloud", href: "/products/cloud", icon: CloudCog },
  { key: "security", href: "/products/security", icon: ShieldCheck },
  { key: "email", href: "/products/email", icon: Mail },
] as const;

export const navLinks = [
  { key: "products", href: "/products" },
  { key: "solutions", href: "/solutions" },
  { key: "industries", href: "/industries" },
  { key: "pricing", href: "/pricing" },
  { key: "portfolio", href: "/portfolio" },
  { key: "knowledgeBase", href: "/knowledge-base" },
  { key: "careers", href: "/careers" },
  { key: "contact", href: "/contact" },
] as const;

export const resourceLinks = [
  { key: "blog", href: "/blog" },
  { key: "knowledgeBase", href: "/knowledge-base" },
  { key: "about", href: "/about" },
  { key: "team", href: "/team" },
] as const;
