import { AdminCrmPanel } from "@/components/admin/admin-crm-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">CRM</h1>
        <p className="text-sm text-muted mt-1">Leads, pipeline stages, and activity log.</p>
      </div>
      <AdminCrmPanel />
    </div>
  );
}
