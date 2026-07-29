import { Suspense } from "react";
import { ManagedDomainDetailView } from "@/components/staff/managed-domain-detail-view";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <ManagedDomainDetailView domainId={id} />
    </Suspense>
  );
}
