import { Suspense } from "react";
import { StaffAccessRequestsPanel } from "@/components/staff/staff-access-requests-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function StaffAccessRequestsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <StaffAccessRequestsPanel />
    </Suspense>
  );
}
