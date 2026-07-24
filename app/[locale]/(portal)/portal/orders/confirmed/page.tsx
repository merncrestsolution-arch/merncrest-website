import { Suspense } from "react";
import { OrderConfirmedView } from "@/components/commerce/order-confirmed-view";

export default function Page() {
  return (
    <Suspense fallback={<p className="rlk-empty">Loading…</p>}>
      <OrderConfirmedView />
    </Suspense>
  );
}
