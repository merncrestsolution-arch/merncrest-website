import { Suspense } from "react";
import { StaffInvoicesPanel } from "@/components/staff/staff-invoices-panel";

export default function Page() {
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading billing…</p>}>
      <StaffInvoicesPanel />
    </Suspense>
  );
}
