import { Suspense } from "react";
import { PortalHistoryPanel } from "@/components/portal/portal-history-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalPaymentsPage() {
  return (
    <RlkPage
      title="Payment History"
      description="Service payments and custom project payment records."
    >
      <Suspense fallback={<p className="rlk-empty">Loading…</p>}>
        <PortalHistoryPanel />
      </Suspense>
    </RlkPage>
  );
}
