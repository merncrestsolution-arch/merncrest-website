import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole, isStaffRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { StaffShell } from "@/components/staff/staff-shell";
import { IdleLogout } from "@/components/staff/idle-logout";
import { isSystemSurface, shouldUseSystemShell } from "@/lib/system-surface";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  const system = await shouldUseSystemShell();
  const systemHost = await isSystemSurface();

  if (!user) {
    redirect(
      systemHost || system
        ? `/${locale}/login?system=1&next=/${locale}/admin`
        : `/${locale}/login`
    );
  }

  if (!isStaffRole(user.role)) {
    redirect(
      systemHost || system
        ? `/${locale}/login?system=1&reason=staff`
        : `/${locale}/portal`
    );
  }

  // System.merncrest.lk + local /admin → Stitch System shell
  if (system) {
    return (
      <>
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

  return <AdminShell user={user}>{children}</AdminShell>;
}
