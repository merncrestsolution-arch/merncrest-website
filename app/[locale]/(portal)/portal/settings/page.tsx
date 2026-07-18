import { ComingOnline } from "@/components/ui/coming-online";

export default function PortalSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Account Settings</h1>
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        {[
          "Personal & business details",
          "Password change",
          "Two-factor authentication (2FA)",
          "Login history",
          "Connected WhatsApp number",
          "Language & timezone",
          "Communication preferences",
          "Delete account request",
        ].map((item) => (
          <div key={item} className="rounded-lg border border-white/10 px-4 py-3 text-muted">{item}</div>
        ))}
      </div>
      <ComingOnline title="Profile security & preference APIs" />
    </div>
  );
}
