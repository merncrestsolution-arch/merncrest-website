import { ErpInventoryPanel } from "@/components/erp/erp-inventory-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Inventory (SCM)</h1>
        <p className="text-sm text-muted mt-1">Stock levels and reorder alerts.</p>
      </div>
      <ErpInventoryPanel />
    </div>
  );
}
