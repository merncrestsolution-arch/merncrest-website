import { TicketsPanel } from "@/components/support/tickets-panel";

export default function PortalTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-muted mt-1">Open and track tickets across portal, chat, and WhatsApp.</p>
      </div>
      <TicketsPanel />
    </div>
  );
}
