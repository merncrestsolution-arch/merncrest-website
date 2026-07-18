import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({
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

  return <PortalShell user={user}>{children}</PortalShell>;
}
