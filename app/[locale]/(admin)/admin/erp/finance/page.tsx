import { ErpFinancePanel } from "@/components/erp/erp-finance-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Finance</h1>
        <p className="text-sm text-muted mt-1">Income, expenses, and internal P&amp;L.</p>
      </div>
      <ErpFinancePanel />
    </div>
  );
}
