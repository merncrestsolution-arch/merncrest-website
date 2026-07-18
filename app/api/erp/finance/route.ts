import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.finance.view", "erp.finance.manage"]);
  if (auth.error) return auth.error;

  const entries = await prisma.financeEntry.findMany({
    include: { createdBy: { select: { fullName: true } } },
    orderBy: { entryDate: "desc" },
    take: 100,
  });

  const income = entries.filter((e) => e.type === "INCOME").reduce((s, e) => s + e.amountCents, 0);
  const expense = entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amountCents, 0);

  return NextResponse.json({
    entries,
    summary: { incomeCents: income, expenseCents: expense, netCents: income - expense },
  });
}

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]),
  category: z.string().min(1),
  description: z.string().min(2),
  amountCents: z.number().int().positive(),
  entryDate: z.string().optional(),
  reference: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.finance.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }

  const entry = await prisma.financeEntry.create({
    data: {
      entryNumber: nextNumber("FIN"),
      type: parsed.data.type,
      category: parsed.data.category,
      description: parsed.data.description,
      amountCents: parsed.data.amountCents,
      entryDate: parsed.data.entryDate ? new Date(parsed.data.entryDate) : new Date(),
      reference: parsed.data.reference,
      createdById: auth.user.id,
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
