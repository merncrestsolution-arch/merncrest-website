import { CartView } from "@/components/commerce/cart-view";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalCartPage() {
  return (
    <RlkPage title="Cart" description="Review items and proceed to checkout.">
      <CartView />
    </RlkPage>
  );
}
