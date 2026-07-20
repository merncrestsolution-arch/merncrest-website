import { ErpOrgPanel } from "@/components/erp/erp-org-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Organization & Branches</h1>
        <p className="text-sm text-muted mt-1">
          Companies, branches, and departments — multi-tenant ready for SaaS.
        </p>
      </div>
      <ErpOrgPanel />
    </div>
  );
}
