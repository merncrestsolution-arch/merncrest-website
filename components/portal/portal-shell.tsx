"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import type { SessionUser } from "@/lib/auth-types";

const mobileLinks = [
  { href: "/portal", key: "overview" },
  { href: "/portal/services", key: "services" },
  { href: "/portal/cart", key: "cart" },
  { href: "/portal/orders", key: "orders" },
  { href: "/portal/domains", key: "domains" },
  { href: "/portal/hosting", key: "hosting" },
  { href: "/portal/invoices", key: "invoices" },
  { href: "/portal/tickets", key: "tickets" },
  { href: "/portal/notifications", key: "notifications" },
  { href: "/portal/settings", key: "settings" },
] as const;

function PortalMobileNav() {
  const t = useTranslations("portal");
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

export function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block sticky top-0 h-screen">
        <PortalSidebar userName={user.fullName} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-display font-bold gradient-text">
            MernCrest Portal
          </Link>
          <span className="text-xs text-muted truncate max-w-[40%]">{user.fullName}</span>
        </header>
        <PortalMobileNav />
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
