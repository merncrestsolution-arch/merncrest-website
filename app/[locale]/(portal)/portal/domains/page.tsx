import { DomainsManager } from "@/components/domains/domains-manager";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalDomainsPage() {
  return (
    <RlkPage
      title="My Domains"
      description="Search, register, renew, DNS, WHOIS lock, and auto-renewal."
    >
      <DomainsManager />
    </RlkPage>
  );
}
