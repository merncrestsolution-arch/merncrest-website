import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.procurement.view", "erp.procurement.manage"]);
  if (auth.error) return auth.error;

  const [vendors, orders] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" }, take: 50 }),
    prisma.purchaseOrder.findMany({
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return NextResponse.json({ vendors, orders });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.procurement.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "vendor") {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      category: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: nextNumber("VEN"),
        ...parsed.data,
        ownerId: auth.user.id,
      },
    });
    return NextResponse.json({ vendor }, { status: 201 });
  }

  const schema = z.object({
    vendorId: z.string().optional(),
    description: z.string().min(2),
    amountCents: z.number().int().positive(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid PO" }, { status: 400 });

  const order = await prisma.purchaseOrder.create({
    data: {
      poNumber: nextNumber("PO"),
      vendorId: parsed.data.vendorId,
      description: parsed.data.description,
      amountCents: parsed.data.amountCents,
      status: "SUBMITTED",
    },
  });
  return NextResponse.json({ order }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.procurement.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const order = await prisma.purchaseOrder.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      orderedAt: parsed.data.status === "ORDERED" ? new Date() : undefined,
    },
  });
  return NextResponse.json({ order });
}
