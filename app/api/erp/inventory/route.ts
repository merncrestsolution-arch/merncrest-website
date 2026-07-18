import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.inventory.view", "erp.inventory.manage"]);
  if (auth.error) return auth.error;

  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" }, take: 200 });
  const lowStock = items.filter((i) => i.quantity <= i.reorderLevel);
  return NextResponse.json({ items, lowStock });
}

const schema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(1),
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  unitCostCents: z.number().int().min(0).optional(),
  location: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.inventory.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      sku: parsed.data.sku.toUpperCase(),
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity ?? 0,
      reorderLevel: parsed.data.reorderLevel ?? 5,
      unitCostCents: parsed.data.unitCostCents ?? 0,
      location: parsed.data.location,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.inventory.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = z
    .object({
      id: z.string(),
      quantity: z.number().int().min(0).optional(),
      reorderLevel: z.number().int().min(0).optional(),
      delta: z.number().int().optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (parsed.data.delta != null) {
    const current = await prisma.inventoryItem.findUnique({ where: { id: parsed.data.id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await prisma.inventoryItem.update({
      where: { id: parsed.data.id },
      data: { quantity: Math.max(0, current.quantity + parsed.data.delta) },
    });
    return NextResponse.json({ item });
  }

  const item = await prisma.inventoryItem.update({
    where: { id: parsed.data.id },
    data: {
      quantity: parsed.data.quantity,
      reorderLevel: parsed.data.reorderLevel,
    },
  });
  return NextResponse.json({ item });
}
