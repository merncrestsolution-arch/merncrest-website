import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { ComingOnline } from "@/components/ui/coming-online";

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
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <ComingOnline title="Platform settings" />
    </div>
  );
}
