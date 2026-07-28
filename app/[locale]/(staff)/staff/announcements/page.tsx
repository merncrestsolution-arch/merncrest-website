import { Suspense } from "react";
import { StaffAnnouncementsHub } from "@/components/staff/staff-announcements-hub";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffAnnouncementsHub />
    </Suspense>
  );
}
