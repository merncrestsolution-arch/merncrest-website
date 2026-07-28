import { Suspense } from "react";
import { StaffDomainsPanel } from "@/components/staff/staff-domains-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffDomainsPanel />
    </Suspense>
  );
}
