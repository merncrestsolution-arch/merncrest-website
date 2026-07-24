import { RefundsPanel } from "@/components/commerce/refunds-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalRefundsPage() {
  return (
    <RlkPage title="Refunds" description="Request and track refunds for paid orders.">
      <RefundsPanel />
    </RlkPage>
  );
}
