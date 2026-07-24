"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { CommandSearchProvider, SearchTrigger } from "@/components/layout/command-search";
import type { SessionUser } from "@/lib/auth-types";

const mobileLinks = [
  { href: "/admin", key: "dashboard" },
  { href: "/admin/customers", key: "customers" },
  { href: "/admin/orders", key: "orders" },
  { href: "/admin/billing", key: "billing" },
  { href: "/admin/crm", key: "crm" },
  { href: "/admin/support", key: "support" },
  { href: "/admin/reports", key: "reports" },
] as const;

function AdminMobileNav() {
  const t = useTranslations("admin");
  return (
    <div className="md:hidden border-b border-white/10 overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {mobileLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted hover:text-foreground hover:border-violet-400/40"
          >
            {t(l.key)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  return (
    <CommandSearchProvider>
      <div className="dark flex min-h-screen bg-[#0e0e12] text-[#e4e1e7]" style={{ colorScheme: "dark" }}>
        <div className="hidden md:block sticky top-0 h-screen">
          <AdminSidebar userName={user.fullName} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e0e12]/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="md:hidden">
              <Link href="/" className="font-display font-bold gradient-text">
                MernCrest Admin
              </Link>
            </div>
            <div className="hidden md:block font-display text-sm font-semibold text-white">
              Admin Console
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <SearchTrigger />
              <span className="text-xs text-[#ccc3d8] truncate max-w-[8rem] sm:max-w-[12rem]">
                {user.fullName}
              </span>
            </div>
          </header>
          <AdminMobileNav />
          <main className="flex-1 p-6 lg:p-10 text-[#e4e1e7]">{children}</main>
        </div>
      </div>
    </CommandSearchProvider>
  );
}
