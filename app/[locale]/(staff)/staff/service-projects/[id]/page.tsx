import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceProject = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    select: { erpProjectId: true },
  });

  if (serviceProject?.erpProjectId) {
    redirect(`/staff/projects/${serviceProject.erpProjectId}#services`);
  }

  redirect("/staff/projects");
}
