import { ErpCoaPanel } from "@/components/erp/erp-coa-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Chart of Accounts</h1>
        <p className="text-sm text-muted mt-1">
          Ledger structure for GL, AR, AP, and financial reporting.
        </p>
      </div>
      <ErpCoaPanel />
    </div>
  );
}
