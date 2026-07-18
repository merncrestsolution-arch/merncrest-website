import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.esm.view", "erp.esm.manage"]);
  if (auth.error) return auth.error;

  const [catalog, incidents] = await Promise.all([
    prisma.serviceCatalogItem.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.esIncident.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return NextResponse.json({ catalog, incidents });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.esm.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "catalog") {
    const schema = z.object({
      name: z.string().min(2),
      category: z.string().min(1),
      description: z.string().optional(),
      slaHours: z.number().int().positive().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const item = await prisma.serviceCatalogItem.create({
      data: {
        code: nextNumber("SVC"),
        ...parsed.data,
        slaHours: parsed.data.slaHours ?? 24,
      },
    });
    return NextResponse.json({ item }, { status: 201 });
  }

  const schema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    type: z.enum(["INCIDENT", "PROBLEM", "CHANGE", "REQUEST"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const slaHours = 24;
  const incident = await prisma.esIncident.create({
    data: {
      incidentNumber: nextNumber("INC"),
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type ?? "INCIDENT",
      priority: parsed.data.priority ?? "MEDIUM",
      slaDueAt: new Date(Date.now() + slaHours * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ incident }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.esm.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const incident = await prisma.esIncident.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ incident });
}
