import { OrdersList } from "@/components/commerce/orders-list";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalOrdersPage() {
  return (
    <RlkPage title="Orders" description="View order history and track fulfillment status.">
      <OrdersList />
    </RlkPage>
  );
}
