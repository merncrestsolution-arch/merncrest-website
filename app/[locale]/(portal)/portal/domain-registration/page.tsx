import { DomainRegistrationPanel } from "@/components/portal/domain-registration-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalDomainRegistrationPage() {
  return (
    <RlkPage
      title="Domain Registration Documents"
      description="Submit registration documents for approval before your domain is activated."
    >
      <DomainRegistrationPanel />
    </RlkPage>
  );
}
