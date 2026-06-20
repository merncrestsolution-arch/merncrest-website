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
} from "lucide-react";

export interface ServiceMenuItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const serviceMenuItems: ServiceMenuItem[] = [
  {
    key: "softwareDevelopment",
    href: "/services/software-development",
    icon: Code2,
  },
  {
    key: "webDevelopment",
    href: "/services/web-development",
    icon: Globe,
  },
  {
    key: "mobileAppDevelopment",
    href: "/services/mobile-app-development",
    icon: Smartphone,
  },
  {
    key: "cloudServices",
    href: "/services/cloud-services",
    icon: Cloud,
  },
  {
    key: "cyberSecurity",
    href: "/services/cyber-security",
    icon: Shield,
  },
  {
    key: "aiSolutions",
    href: "/services/ai-solutions",
    icon: Brain,
  },
  {
    key: "digitalMarketing",
    href: "/services/digital-marketing",
    icon: Megaphone,
  },
  {
    key: "itConsulting",
    href: "/services/it-consulting",
    icon: Briefcase,
  },
  {
    key: "hostingDomain",
    href: "/services/hosting-domain",
    icon: Server,
  },
];

export const navLinks = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "solutions", href: "/solutions" },
  { key: "portfolio", href: "/portfolio" },
  { key: "team", href: "/team" },
  { key: "technologies", href: "/technologies" },
  { key: "careers", href: "/careers" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;
