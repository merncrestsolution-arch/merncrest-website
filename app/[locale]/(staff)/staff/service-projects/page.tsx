import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erpProjectId?: string; name?: string }>;
}) {
  const params = await searchParams;
  if (params.erpProjectId) {
    const q = new URLSearchParams();
    if (params.name) q.set("name", params.name);
    redirect(`/staff/projects/${params.erpProjectId}${q.size ? `?${q}` : ""}#services`);
  }
  redirect("/staff/projects");
}
