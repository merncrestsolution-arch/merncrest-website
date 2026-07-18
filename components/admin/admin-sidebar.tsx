"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Contact,
  LifeBuoy,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "customers", href: "/admin/customers", icon: Users },
  { key: "orders", href: "/admin/orders", icon: ShoppingBag },
  { key: "billing", href: "/admin/billing", icon: CreditCard },
  { key: "crm", href: "/admin/crm", icon: Contact },
  { key: "support", href: "/admin/support", icon: LifeBuoy },
  { key: "erp", href: "/admin/erp", icon: Building2 },
  { key: "reports", href: "/admin/reports", icon: BarChart3 },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar({ userName }: { userName?: string }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[#061018] flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="font-display text-lg font-bold gradient-text">
          MernCrest
        </Link>
        <p className="text-xs text-muted mt-1">{t("title")}</p>
        {userName && <p className="text-xs text-foreground/80 mt-2 truncate">{userName}</p>}
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.key}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
