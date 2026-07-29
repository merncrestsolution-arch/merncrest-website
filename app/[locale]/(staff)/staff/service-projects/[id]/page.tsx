import { Suspense } from "react";
import { StaffServiceProjectDetail } from "@/components/staff/staff-service-project-detail";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState />}>
      <StaffServiceProjectDetail projectId={id} />
    </Suspense>
  );
}
