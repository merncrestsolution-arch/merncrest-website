import { redirect } from "next/navigation";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!isStaffRole(user.role)) {
    redirect(`/${locale}/portal`);
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
