import { Suspense } from "react";
import { StaffHostingPanel } from "@/components/staff/staff-hosting-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffHostingPanel />
    </Suspense>
  );
}
