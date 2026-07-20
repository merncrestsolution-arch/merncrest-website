import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/** Organization + Branch management (multi-tenant ready) */
export async function GET() {
  const auth = await requirePermission("erp.analytics.view");
  if (auth.error) return auth.error;

  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    include: {
      branches: { where: { deletedAt: null }, orderBy: { name: "asc" } },
    },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } },
  });

  return NextResponse.json({ organizations, departments });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.permissions.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "branch") {
    const schema = z.object({
      organizationId: z.string(),
      code: z.string().min(1),
      name: z.string().min(2),
      city: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      isHeadOffice: z.boolean().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    }
    const branch = await prisma.branch.create({ data: parsed.data });
    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "ORG",
      entityType: "Branch",
      entityId: branch.id,
      summary: `Branch created: ${branch.name}`,
    });
    return NextResponse.json({ branch }, { status: 201 });
  }

  if (body.action === "department") {
    const schema = z.object({
      code: z.string().min(1),
      name: z.string().min(2),
      description: z.string().optional(),
      parentId: z.string().optional().nullable(),
      costCenter: z.string().optional().nullable(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
    const department = await prisma.department.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        parentId: parsed.data.parentId || null,
        costCenter: parsed.data.costCenter || null,
      },
    });
    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "ORG",
      entityType: "Department",
      entityId: department.id,
      summary: `Department created: ${department.name}`,
    });
    return NextResponse.json({ department }, { status: 201 });
  }

  const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(2),
    legalName: z.string().optional(),
    taxId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    isPrimary: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid organization" }, { status: 400 });
  }

  const organization = await prisma.organization.create({
    data: {
      ...parsed.data,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "ORG",
    entityType: "Organization",
    entityId: organization.id,
    summary: `Organization created: ${organization.name}`,
  });

  return NextResponse.json({ organization }, { status: 201 });
}
