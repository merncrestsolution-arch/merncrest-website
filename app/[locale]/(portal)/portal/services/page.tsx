import { PortalServicesPanel } from "@/components/portal/portal-services-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalServicesPage() {
  return (
    <RlkPage
      title="My Services"
      description="Domains, hosting, subscriptions, and custom projects — activated after payment verification."
    >
      <PortalServicesPanel />
    </RlkPage>
  );
}
