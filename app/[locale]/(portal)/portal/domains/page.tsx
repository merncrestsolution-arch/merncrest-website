import { ComingOnline } from "@/components/ui/coming-online";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function PortalDomainsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Domains</h1>
          <p className="text-sm text-muted mt-1">Search, renew, transfer, DNS, WHOIS, and auto-renewal.</p>
        </div>
        <Button asChild size="sm"><Link href="/domains">Register domain</Link></Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        {["Search", "Renew", "Transfer", "Manage DNS", "WHOIS", "Nameservers", "Auto Renewal", "Domain Lock"].map((a) => (
          <div key={a} className="rounded-lg border border-white/10 px-4 py-3 text-muted">{a}</div>
        ))}
      </div>
      <ComingOnline title="Live domain portfolio & DNS editor" />
    </div>
  );
}
