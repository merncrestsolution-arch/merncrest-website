import { Suspense } from "react";
import { DomainDetailView } from "@/components/staff/domain-detail-view";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <DomainDetailView domainId={id} />
    </Suspense>
  );
}
