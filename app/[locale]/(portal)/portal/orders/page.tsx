import { OrdersList } from "@/components/commerce/orders-list";

export default function PortalOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <OrdersList />
    </div>
  );
}
