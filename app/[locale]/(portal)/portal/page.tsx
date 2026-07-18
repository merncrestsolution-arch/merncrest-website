"use client";

import { ComingOnline } from "@/components/ui/coming-online";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/auth-types";

const cards = [
  { href: "/portal/orders", label: "Orders", hint: "Track purchases" },
  { href: "/portal/domains", label: "Domains", hint: "DNS & renewals" },
  { href: "/portal/hosting", label: "Hosting", hint: "VPS & cloud" },
  { href: "/portal/invoices", label: "Invoices", hint: "Pay & download" },
  { href: "/portal/tickets", label: "Tickets", hint: "Get support" },
  { href: "/portal/downloads", label: "Downloads", hint: "Licenses & files" },
];

export default function PortalHomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold">
          Welcome{user ? `, ${user.fullName.split(" ")[0]}` : " back"}
        </h1>
        <p className="mt-2 text-muted">
          Manage all your MernCrest services from one place.
          {user && !user.emailVerifiedAt && (
            <span className="block mt-2 text-amber-400 text-sm">
              Please verify your email — check your inbox for the confirmation link.
            </span>
          )}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-accent/40 transition-colors"
          >
            <p className="font-display font-semibold">{c.label}</p>
            <p className="text-sm text-muted mt-1">{c.hint}</p>
          </Link>
        ))}
      </div>

      <ComingOnline title="Live metrics" />
    </div>
  );
}
