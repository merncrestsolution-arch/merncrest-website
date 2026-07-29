import { Suspense } from "react";
import { StaffMailboxPanel } from "@/components/staff/staff-mailbox-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffMailboxPanel />
    </Suspense>
  );
}
