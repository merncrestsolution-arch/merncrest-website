import { redirect } from "@/i18n/routing";

/** Legacy singular path → /partners */
export default async function PartnerRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/partners", locale });
}
