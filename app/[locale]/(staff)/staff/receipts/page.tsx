import { Suspense } from "react";
import { StaffReceiptsPanel } from "@/components/staff/staff-receipts-panel";

export default function Page() {
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading receipts…</p>}>
      <StaffReceiptsPanel />
    </Suspense>
  );
}
