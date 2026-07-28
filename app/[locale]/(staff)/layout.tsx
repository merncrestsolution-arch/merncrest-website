import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole, isStaffRole } from "@/lib/auth";
import { StaffShell } from "@/components/staff/staff-shell";
import { IdleLogout } from "@/components/staff/idle-logout";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login?system=1&next=/${locale}/staff`);
  if (!isStaffRole(user.role)) {
    redirect(`/${locale}/login?system=1&next=/${locale}/staff&reason=staff`);
  }
  return (
    <>
      <link rel="manifest" href="/system-manifest.json" />
      <meta name="theme-color" content="#0b1a33" />
      <IdleLogout minutes={30} />
      <StaffShell
        userName={user.fullName}
        userRole={user.role}
        isSuperAdmin={isAdminRole(user.role)}
      >
        {children}
      </StaffShell>
    </>
  );
}
