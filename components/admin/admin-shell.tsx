"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
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
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-muted hover:text-foreground hover:border-accent/40"
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
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block sticky top-0 h-screen">
        <AdminSidebar userName={user.fullName} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-display font-bold gradient-text">
            MernCrest Admin
          </Link>
          <span className="text-xs text-muted truncate max-w-[40%]">{user.fullName}</span>
        </header>
        <AdminMobileNav />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
