import { Suspense } from "react";
import { SystemBillingPanel } from "@/components/admin/system-billing-panel";

export default function Page() {
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading receipts…</p>}>
      <SystemBillingPanel initialTab="receipts" />
    </Suspense>
  );
}
