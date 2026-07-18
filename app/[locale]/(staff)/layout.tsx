import { redirect } from "next/navigation";
import { getSessionUser, isStaffRole } from "@/lib/auth";
import { StaffShell } from "@/components/staff/staff-shell";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!isStaffRole(user.role)) redirect(`/${locale}/portal`);
  return <StaffShell userName={user.fullName}>{children}</StaffShell>;
}
