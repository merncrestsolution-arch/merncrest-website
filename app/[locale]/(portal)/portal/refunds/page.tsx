import { RefundsPanel } from "@/components/commerce/refunds-panel";

export default function PortalRefundsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Refunds</h1>
        <p className="text-sm text-muted mt-1">Request and track refunds for paid orders.</p>
      </div>
      <RefundsPanel />
    </div>
  );
}
