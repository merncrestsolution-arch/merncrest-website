import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.mfg.view", "erp.mfg.manage"]);
  if (auth.error) return auth.error;

  const [boms, orders] = await Promise.all([
    prisma.bom.findMany({ include: { lines: true }, take: 30 }),
    prisma.productionOrder.findMany({ include: { bom: true }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  return NextResponse.json({ boms, orders });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.mfg.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "bom") {
    const schema = z.object({
      productName: z.string().min(2),
      description: z.string().optional(),
      lines: z.array(z.object({ componentSku: z.string(), quantity: z.number().positive() })).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid BOM" }, { status: 400 });
    const bom = await prisma.bom.create({
      data: {
        bomCode: nextNumber("BOM"),
        productName: parsed.data.productName,
        description: parsed.data.description,
        lines: parsed.data.lines?.length
          ? { create: parsed.data.lines }
          : undefined,
      },
      include: { lines: true },
    });
    return NextResponse.json({ bom }, { status: 201 });
  }

  const schema = z.object({
    productName: z.string().min(2),
    quantity: z.number().int().positive().optional(),
    bomId: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const order = await prisma.productionOrder.create({
    data: {
      orderNumber: nextNumber("MO"),
      productName: parsed.data.productName,
      quantity: parsed.data.quantity ?? 1,
      bomId: parsed.data.bomId,
      status: "PLANNED",
    },
  });
  return NextResponse.json({ order }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.mfg.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const order = await prisma.productionOrder.update({
    where: { id: body.id },
    data: { status: body.status },
  });
  return NextResponse.json({ order });
}
