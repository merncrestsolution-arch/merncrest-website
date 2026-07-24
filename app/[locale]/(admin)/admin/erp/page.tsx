import { redirect } from "next/navigation";

/** Legacy ERP module grid removed — land on staff command center instead. */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/staff`);
}
