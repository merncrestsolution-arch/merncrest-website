import { AdminProvidersPanel } from "@/components/admin/admin-providers-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Providers</h1>
      <AdminProvidersPanel />
    </div>
  );
}
