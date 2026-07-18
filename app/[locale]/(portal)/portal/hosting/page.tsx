import { ComingOnline } from "@/components/ui/coming-online";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const metrics = ["Disk Usage", "Bandwidth", "CPU", "RAM", "SSL", "FTP", "Email Accounts", "Databases", "Backup Status"];

export default function PortalHostingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Hosting</h1>
          <p className="text-sm text-muted mt-1">Resource graphs, SSL, backups, and control panel access.</p>
        </div>
        <Button asChild size="sm" variant="outline"><Link href="/hosting">Order hosting</Link></Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m} className="rounded-xl border border-white/10 p-4">
            <p className="text-xs font-mono text-muted uppercase">{m}</p>
            <p className="font-display text-xl font-bold mt-2 text-muted/40">—</p>
          </div>
        ))}
      </div>
      <ComingOnline title="Live hosting metrics & cPanel SSO" />
    </div>
  );
}
