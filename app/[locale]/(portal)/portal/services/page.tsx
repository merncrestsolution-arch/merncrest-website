"use client";

import { ComingOnline } from "@/components/ui/coming-online";
import { Link } from "@/i18n/routing";

const services = [
  { name: "Domains", status: "Ready", href: "/portal/domains", note: "Search, renew, DNS, WHOIS" },
  { name: "Hosting", status: "Ready", href: "/portal/hosting", note: "Usage, SSL, backups, panel" },
  { name: "Cloud", status: "Coming", href: "/cloud", note: "AWS workloads & monitoring" },
  { name: "Software / ERP / CRM", status: "Coming", href: "/solutions", note: "Licenses & project access" },
  { name: "Email", status: "Coming", href: "/products/email", note: "Mailboxes & Workspace" },
  { name: "SSL & Backups", status: "Coming", href: "/products/security", note: "Certificates & restore points" },
];

export default function MyServicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">My Services</h1>
        <p className="text-muted mt-1 text-sm">Active services, renewals, and quick actions.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {services.map((s) => (
          <Link
            key={s.name}
            href={s.href}
            className="rounded-xl border border-white/10 p-5 hover:border-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold">{s.name}</h2>
              <span className="text-xs font-mono text-accent">{s.status}</span>
            </div>
            <p className="text-sm text-muted mt-2">{s.note}</p>
          </Link>
        ))}
      </div>
      <ComingOnline title="Service activation & renewal automation" />
    </div>
  );
}
