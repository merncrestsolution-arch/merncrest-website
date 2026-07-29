import { PortalProjectHubView } from "@/components/portal/portal-project-hub-view";
import { RlkPage } from "@/components/rlk/rlk-page";

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RlkPage title="Project" description="View your project progress, resources, and billing.">
      <PortalProjectHubView projectId={id} />
    </RlkPage>
  );
}
