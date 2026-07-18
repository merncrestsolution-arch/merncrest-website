import { ErpDocumentsPanel } from "@/components/erp/erp-documents-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Document Management (5.17)</h1>
        <p className="text-sm text-muted mt-1">Repository, versions, digital approval, and audit trail.</p>
      </div>
      <ErpDocumentsPanel />
    </div>
  );
}
