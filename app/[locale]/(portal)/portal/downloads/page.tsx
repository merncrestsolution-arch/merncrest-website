import { PortalDownloadsPanel } from "@/components/portal/portal-downloads-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalDownloadsPage() {
  return (
    <RlkPage title="Downloads" description="Invoices, receipts, licenses, and manuals.">
      <PortalDownloadsPanel />
    </RlkPage>
  );
}
