import { ComingOnline } from "@/components/ui/coming-online";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Notifications</h1>
      <div className="rounded-xl border border-white/10 p-4 text-sm">
        <p className="font-medium">Welcome to the MernCrest Customer Portal</p>
        <p className="text-muted mt-1">Billing reminders, maintenance notices, and security alerts will appear here.</p>
      </div>
      <ComingOnline title="Email / WhatsApp / SMS notification sync" />
    </div>
  );
}
