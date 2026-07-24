import { ErpFinancePanel } from "@/components/erp/erp-finance-panel";
import { SystemFinanceHub } from "@/components/admin/system-finance-hub";

export default function Page() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted mt-1">
          Invoices, payments, quotations, and internal P&amp;L in one hub.
        </p>
      </div>
      <SystemFinanceHub />
      <div>
        <h2 className="font-display text-lg font-semibold mb-4">ERP ledger</h2>
        <ErpFinancePanel />
      </div>
    </div>
  );
}
