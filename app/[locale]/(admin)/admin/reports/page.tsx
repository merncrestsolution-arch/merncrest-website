import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted mt-1">Business performance across commerce and ERP.</p>
      </div>
      <AdminReportsPanel />
    </div>
  );
}
