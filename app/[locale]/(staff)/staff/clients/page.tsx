import { Suspense } from "react";
import { StaffClientsPanel } from "@/components/staff/staff-clients-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffClientsPanel />
    </Suspense>
  );
}
