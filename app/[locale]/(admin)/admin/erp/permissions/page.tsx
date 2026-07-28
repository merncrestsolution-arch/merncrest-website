import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { ErpPermissionsPanel } from "@/components/erp/erp-permissions-panel";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) {
    redirect(`/${locale}/staff`);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Roles &amp; Permissions</h1>
        <p className="text-sm text-muted mt-1">Fine-grained ERP access for staff.</p>
      </div>
      <ErpPermissionsPanel />
    </div>
  );
}
