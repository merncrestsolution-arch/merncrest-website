import { Suspense } from "react";
import { StaffServiceProjectsPanel } from "@/components/staff/staff-service-projects-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffServiceProjectsPanel />
    </Suspense>
  );
}
