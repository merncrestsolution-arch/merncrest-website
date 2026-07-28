import { Suspense } from "react";
import { StaffResourcesHub } from "@/components/staff/staff-resources-hub";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffResourcesHub />
    </Suspense>
  );
}
