import { ErpFsmPanel } from "@/components/erp/erp-fsm-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Field Service (FSM)</h1>
        <p className="text-sm text-muted mt-1">Work orders for on-site and remote jobs.</p>
      </div>
      <ErpFsmPanel />
    </div>
  );
}
