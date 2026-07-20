import { ErpApprovalsPanel } from "@/components/erp/erp-approvals-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Approval Workflows</h1>
        <p className="text-sm text-muted mt-1">
          Leave, purchase, expense, quotation, project, and document approvals.
        </p>
      </div>
      <ErpApprovalsPanel />
    </div>
  );
}
