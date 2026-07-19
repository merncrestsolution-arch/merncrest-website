import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Building2,
  Cloud,
  Code2,
  Contact,
  FileText,
  Globe2,
  HardDrive,
  Headphones,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Newspaper,
  Package,
  Palette,
  ShieldCheck,
  ShoppingCart,
  Users,
  Briefcase,
} from "lucide-react";

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "Pages" | "Products" | "Services" | "Portal" | "Admin" | "Support";
  keywords: string[];
  icon: LucideIcon;
};

export const SITE_SEARCH_INDEX: SearchItem[] = [
  {
    id: "home",
    title: "Home",
    description: "MernCrest Solutions overview",
    href: "/",
    category: "Pages",
    keywords: ["home", "landing", "merncrest"],
    icon: Home,
  },
  {
    id: "about",
    title: "About Us",
    description: "Who we are and how we work",
    href: "/about",
    category: "Pages",
    keywords: ["company", "team", "story"],
    icon: Users,
  },
  {
    id: "services",
    title: "Services",
    description: "Software, cloud, security, and more",
    href: "/services",
    category: "Services",
    keywords: ["services", "development"],
    icon: Code2,
  },
  {
    id: "solutions",
    title: "Enterprise Solutions",
    description: "ERP, CRM, and digital platforms",
    href: "/solutions",
    category: "Services",
    keywords: ["erp", "crm", "enterprise"],
    icon: Building2,
  },
  {
    id: "products",
    title: "Products",
    description: "Domains, hosting, software catalog",
    href: "/products",
    category: "Products",
    keywords: ["catalog", "buy", "shop"],
    icon: Package,
  },
  {
    id: "domains",
    title: "Domain Search",
    description: "Register .lk, .com, and more",
    href: "/domains",
    category: "Products",
    keywords: ["domain", "dns", "register", ".lk"],
    icon: Globe2,
  },
  {
    id: "hosting",
    title: "Hosting",
    description: "Shared, VPS, and managed hosting",
    href: "/hosting",
    category: "Products",
    keywords: ["hosting", "vps", "cpanel", "server"],
    icon: HardDrive,
  },
  {
    id: "cloud",
    title: "Cloud Services",
    description: "AWS migration and management",
    href: "/cloud",
    category: "Products",
    keywords: ["aws", "cloud", "migrate"],
    icon: Cloud,
  },
  {
    id: "security",
    title: "Security",
    description: "SSL, firewall, and monitoring",
    href: "/products/security",
    category: "Products",
    keywords: ["ssl", "firewall", "security"],
    icon: ShieldCheck,
  },
  {
    id: "digital",
    title: "Digital Services",
    description: "Design, SEO, and marketing",
    href: "/products/digital-services",
    category: "Services",
    keywords: ["seo", "design", "marketing"],
    icon: Palette,
  },
  {
    id: "software",
    title: "Software Products",
    description: "ERP, CRM, POS, and custom apps",
    href: "/products/software",
    category: "Products",
    keywords: ["software", "pos", "custom"],
    icon: Boxes,
  },
  {
    id: "email",
    title: "Business Email",
    description: "Workspace and Microsoft 365",
    href: "/products/email",
    category: "Products",
    keywords: ["email", "gmail", "office"],
    icon: Mail,
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Plans and packages",
    href: "/pricing",
    category: "Pages",
    keywords: ["price", "plans", "cost"],
    icon: FileText,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    description: "Selected client work",
    href: "/portfolio",
    category: "Pages",
    keywords: ["work", "projects", "case"],
    icon: Briefcase,
  },
  {
    id: "blog",
    title: "Blog",
    description: "Insights and updates",
    href: "/blog",
    category: "Pages",
    keywords: ["news", "articles"],
    icon: Newspaper,
  },
  {
    id: "kb",
    title: "Knowledge Base",
    description: "Guides and documentation",
    href: "/knowledge-base",
    category: "Support",
    keywords: ["docs", "help", "faq", "guide"],
    icon: HelpCircle,
  },
  {
    id: "support",
    title: "Support Center",
    description: "Tickets, chat, and callbacks",
    href: "/support",
    category: "Support",
    keywords: ["support", "ticket", "helpdesk"],
    icon: LifeBuoy,
  },
  {
    id: "contact",
    title: "Contact / Consultation",
    description: "Get a free consultation",
    href: "/contact",
    category: "Pages",
    keywords: ["contact", "quote", "consultation", "sales"],
    icon: Headphones,
  },
  {
    id: "careers",
    title: "Careers",
    description: "Join the MernCrest team",
    href: "/careers",
    category: "Pages",
    keywords: ["jobs", "hiring"],
    icon: Users,
  },
  {
    id: "login",
    title: "Customer Login",
    description: "Access your portal",
    href: "/login",
    category: "Portal",
    keywords: ["login", "sign in", "account"],
    icon: LayoutDashboard,
  },
  {
    id: "portal",
    title: "Customer Portal",
    description: "Services, orders, invoices",
    href: "/portal",
    category: "Portal",
    keywords: ["portal", "dashboard", "billing"],
    icon: LayoutDashboard,
  },
  {
    id: "cart",
    title: "Cart",
    description: "Review items before checkout",
    href: "/portal/cart",
    category: "Portal",
    keywords: ["cart", "checkout", "buy"],
    icon: ShoppingCart,
  },
  {
    id: "admin",
    title: "Admin Console",
    description: "Customers, CRM, ERP, reports",
    href: "/admin",
    category: "Admin",
    keywords: ["admin", "owner", "staff"],
    icon: LayoutDashboard,
  },
  {
    id: "admin-crm",
    title: "CRM",
    description: "Leads and quotations",
    href: "/admin/crm",
    category: "Admin",
    keywords: ["crm", "leads", "quotes"],
    icon: Contact,
  },
  {
    id: "admin-erp",
    title: "ERP Hub",
    description: "Finance, HR, inventory, more",
    href: "/admin/erp",
    category: "Admin",
    keywords: ["erp", "finance", "hr", "inventory"],
    icon: Building2,
  },
];

export function searchSiteIndex(query: string, limit = 12): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return SITE_SEARCH_INDEX.slice(0, limit);
  }

  const scored = SITE_SEARCH_INDEX.map((item) => {
    const hay = [item.title, item.description, item.category, ...item.keywords]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (item.title.toLowerCase().startsWith(q)) score += 40;
    if (item.title.toLowerCase().includes(q)) score += 25;
    if (item.keywords.some((k) => k.startsWith(q))) score += 20;
    if (hay.includes(q)) score += 10;
    q.split(/\s+/).forEach((part) => {
      if (part && hay.includes(part)) score += 5;
    });
    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.item);
}
