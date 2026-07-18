import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.assets.view", "erp.assets.manage"]);
  if (auth.error) return auth.error;

  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ assets });
}

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  location: z.string().optional(),
  purchaseCents: z.number().int().min(0).optional(),
  assignedTo: z.string().optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.assets.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid asset" }, { status: 400 });
  }

  const asset = await prisma.asset.create({
    data: {
      assetCode: nextNumber("AST"),
      name: parsed.data.name,
      category: parsed.data.category,
      location: parsed.data.location,
      purchaseCents: parsed.data.purchaseCents ?? 0,
      assignedTo: parsed.data.assignedTo,
      status: parsed.data.status ?? (parsed.data.assignedTo ? "ASSIGNED" : "AVAILABLE"),
      purchaseDate: new Date(),
    },
  });
  return NextResponse.json({ asset }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.assets.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]).optional(),
    assignedTo: z.string().nullable().optional(),
    location: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const asset = await prisma.asset.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      assignedTo: parsed.data.assignedTo === null ? null : parsed.data.assignedTo,
      location: parsed.data.location,
    },
  });
  return NextResponse.json({ asset });
}
