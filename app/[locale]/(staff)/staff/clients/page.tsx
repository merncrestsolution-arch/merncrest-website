import { Suspense } from "react";
import { StaffClientsPanel } from "@/components/staff/staff-clients-panel";

export default function Page() {
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading clients…</p>}>
      <StaffClientsPanel />
    </Suspense>
  );
}
