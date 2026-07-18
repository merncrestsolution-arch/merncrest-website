import { DomainsManager } from "@/components/domains/domains-manager";

export default function PortalDomainsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Domains</h1>
        <p className="text-sm text-muted mt-1">Search, register, renew, DNS, WHOIS lock, and auto-renewal.</p>
      </div>
      <DomainsManager />
    </div>
  );
}
