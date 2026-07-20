import { ErpAuditPanel } from "@/components/erp/erp-audit-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted mt-1">
          Searchable trail of create, update, approve, payment, and inventory changes.
        </p>
      </div>
      <ErpAuditPanel />
    </div>
  );
}
