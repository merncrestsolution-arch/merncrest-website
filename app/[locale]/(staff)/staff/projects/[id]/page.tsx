import { Suspense } from "react";
import { StaffProjectDetail } from "@/components/staff/staff-project-detail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="stitch-page-sub">Loading project…</p>}>
      <StaffProjectDetail projectId={id} />
    </Suspense>
  );
}
