import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/**
 * PUBLIC careers read API + minimal admin writes.
 * GET (public): OPEN job openings only, split into roles vs internships.
 * POST/PATCH (admin only): create/update openings, audit-logged.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const opening = await prisma.jobOpening.findFirst({
      where: { id, status: "OPEN" },
    });
    if (!opening) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ opening });
  }

  const openings = await prisma.jobOpening.findMany({
    where: { status: "OPEN" },
    orderBy: [{ isInternship: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      department: true,
      description: true,
      location: true,
      employmentType: true,
      isInternship: true,
      requirementsJson: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    roles: openings.filter((o) => !o.isInternship),
    internships: openings.filter((o) => o.isInternship),
  });
}

const upsertSchema = z.object({
  title: z.string().min(2),
  department: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"])
    .optional(),
  isInternship: z.boolean().optional(),
  requirementsJson: z.string().optional().nullable(),
  status: z.enum(["OPEN", "CLOSED", "FILLED"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid opening" }, { status: 400 });
  }

  const opening = await prisma.jobOpening.create({
    data: {
      ...parsed.data,
      employmentType:
        parsed.data.employmentType ??
        (parsed.data.isInternship ? "INTERNSHIP" : "FULL_TIME"),
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "JobOpening",
    entityId: opening.id,
    summary: `Job opening created: ${opening.title}`,
  });

  return NextResponse.json({ opening }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const schema = upsertSchema.partial().extend({ id: z.string() });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.jobOpening.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const opening = await prisma.jobOpening.update({ where: { id }, data: rest });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "HR",
    entityType: "JobOpening",
    entityId: opening.id,
    summary: `Job opening updated: ${opening.title}`,
  });

  return NextResponse.json({ opening });
}
