import { AdminCustomersPanel } from "@/components/admin/admin-customers-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted mt-1">Customer ID directory and 360° profiles.</p>
      </div>
      <AdminCustomersPanel />
    </div>
  );
}
