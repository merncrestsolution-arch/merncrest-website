import { NotificationsPanel } from "@/components/support/notifications-panel";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted mt-1">Billing, support, orders, and security alerts.</p>
      </div>
      <NotificationsPanel />
    </div>
  );
}
