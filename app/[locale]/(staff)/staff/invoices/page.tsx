import { Suspense } from "react";
import { StaffInvoicesPanel } from "@/components/staff/staff-invoices-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffInvoicesPanel />
    </Suspense>
  );
}
