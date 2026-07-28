import { Suspense } from "react";
import { StaffProjectProgress } from "@/components/staff/staff-project-progress";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffProjectProgress />
    </Suspense>
  );
}
