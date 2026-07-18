import { ErpProcurementPanel } from "@/components/erp/erp-procurement-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Procurement (5.4)</h1>
        <p className="text-sm text-muted mt-1">Vendors, purchase orders, approvals, and receipts.</p>
      </div>
      <ErpProcurementPanel />
    </div>
  );
}
