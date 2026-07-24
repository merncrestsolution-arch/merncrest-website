import { Suspense } from "react";
import { SystemQuotationsPanel } from "@/components/admin/system-quotations-panel";

export default function Page() {
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading quotations…</p>}>
      <SystemQuotationsPanel />
    </Suspense>
  );
}
