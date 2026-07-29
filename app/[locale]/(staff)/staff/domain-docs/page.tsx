import { Suspense } from "react";
import { DomainDocsReviewPanel } from "@/components/staff/domain-docs-review-panel";
import { LoadingState } from "@/components/system/loading-state";

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DomainDocsReviewPanel />
    </Suspense>
  );
}
