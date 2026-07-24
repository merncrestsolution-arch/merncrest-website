import { HostingDashboard } from "@/components/hosting/hosting-dashboard";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalHostingPage() {
  return (
    <RlkPage
      title="My Hosting"
      description="Resource usage, SSL, backups, renewals, and control panel access."
    >
      <HostingDashboard />
    </RlkPage>
  );
}
