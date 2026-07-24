import { TicketsPanel } from "@/components/support/tickets-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalTicketsPage() {
  return (
    <RlkPage
      title="Support Tickets"
      description="Open a ticket like email — our team will reply and close when your issue is resolved."
    >
      <TicketsPanel />
    </RlkPage>
  );
}
