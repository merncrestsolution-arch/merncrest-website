import { AdminCatalogPanel } from "@/components/admin/admin-catalog-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Catalog</h1>
      <AdminCatalogPanel />
    </div>
  );
}
