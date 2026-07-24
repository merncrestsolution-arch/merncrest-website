import { NotificationsPanel } from "@/components/support/notifications-panel";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalNotificationsPage() {
  return (
    <RlkPage
      title="Notifications"
      description="Billing, support, orders, and security alerts."
    >
      <NotificationsPanel />
    </RlkPage>
  );
}
