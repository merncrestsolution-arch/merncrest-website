import { Suspense } from "react";
import { ManagedHostingDetailView } from "@/components/staff/managed-hosting-detail-view";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <ManagedHostingDetailView hostingId={id} />
    </Suspense>
  );
}
