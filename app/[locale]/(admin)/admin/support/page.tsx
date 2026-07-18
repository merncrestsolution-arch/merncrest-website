import { AdminSupportPanel } from "@/components/admin/admin-support-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Support</h1>
        <p className="text-sm text-muted mt-1">Tickets, IVR callbacks, and WhatsApp inbox.</p>
      </div>
      <AdminSupportPanel />
    </div>
  );
}
