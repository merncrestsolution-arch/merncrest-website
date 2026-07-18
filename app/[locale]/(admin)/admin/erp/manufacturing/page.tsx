import { ErpManufacturingPanel } from "@/components/erp/erp-manufacturing-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Manufacturing (5.7)</h1>
        <p className="text-sm text-muted mt-1">BOM, production orders, QC stages, and costing hooks.</p>
      </div>
      <ErpManufacturingPanel />
    </div>
  );
}
