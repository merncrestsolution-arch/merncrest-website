import { ErpPermissionsPanel } from "@/components/erp/erp-permissions-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Roles &amp; Permissions</h1>
        <p className="text-sm text-muted mt-1">Fine-grained ERP access for staff.</p>
      </div>
      <ErpPermissionsPanel />
    </div>
  );
}
