import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { SystemUsersPanel } from "@/components/admin/system-users-panel";

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
  return <SystemUsersPanel />;
}
