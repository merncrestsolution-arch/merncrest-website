import { Suspense } from "react";
import { ClientDetailView } from "@/components/staff/client-detail-view";
import { LoadingState } from "@/components/system/loading-state";

export default async function Page({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <Suspense fallback={<LoadingState />}>
      <ClientDetailView clientId={clientId} />
    </Suspense>
  );
}
