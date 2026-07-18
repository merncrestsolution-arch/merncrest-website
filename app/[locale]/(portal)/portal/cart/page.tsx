import { CartView } from "@/components/commerce/cart-view";

export default function PortalCartPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Cart</h1>
      <CartView />
    </div>
  );
}
