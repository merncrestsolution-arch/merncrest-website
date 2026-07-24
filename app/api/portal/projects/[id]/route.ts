import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { toPortalProject } from "@/lib/portal/project-types";

/** Customer project detail — milestones + progress only */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const project = await prisma.erpProject.findFirst({
    where: {
      id,
      members: { some: { userId: auth.user.id } },
    },
    include: {
      milestones: { orderBy: [{ status: "asc" }, { dueDate: "asc" }] },
      tasks: { select: { status: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: toPortalProject(project) });
}
