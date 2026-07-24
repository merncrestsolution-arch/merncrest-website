import { PortalProjectsPanel } from "@/components/portal/portal-projects-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalProjectsPage() {
  return (
    <RlkPage
      title="My Projects"
      description="Track delivery progress, milestones, payment due dates, and updates from MernCrest."
    >
      <PortalProjectsPanel />
    </RlkPage>
  );
}
