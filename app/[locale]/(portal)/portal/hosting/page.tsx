import { HostingDashboard } from "@/components/hosting/hosting-dashboard";

export default function PortalHostingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Hosting</h1>
        <p className="text-sm text-muted mt-1">Resource usage, SSL, backups, renewals, and control panel access.</p>
      </div>
      <HostingDashboard />
    </div>
  );
}
