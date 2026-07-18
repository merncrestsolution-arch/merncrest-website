import { ComingOnline } from "@/components/ui/coming-online";

export default function PortalOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <ComingOnline title="Order history" />
    </div>
  );
}
