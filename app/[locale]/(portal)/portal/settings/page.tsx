import { PortalSettingsForm } from "@/components/portal/portal-settings-form";
import { RlkPage } from "@/components/rlk/rlk-page";

export default function PortalSettingsPage() {
  return (
    <RlkPage title="Account Settings" description="Profile, contact details, notifications, and login history.">
      <PortalSettingsForm />
    </RlkPage>
  );
}
