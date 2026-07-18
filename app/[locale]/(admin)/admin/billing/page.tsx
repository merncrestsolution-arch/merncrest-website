import { AdminCommercePanel } from "@/components/admin/admin-commerce-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Billing</h1>
      <AdminCommercePanel view="billing" />
    </div>
  );
}
