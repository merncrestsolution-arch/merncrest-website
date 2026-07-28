import { Suspense } from "react";
import { HostingDetailView } from "@/components/staff/hosting-detail-view";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <HostingDetailView hostingId={id} />
    </Suspense>
  );
}
