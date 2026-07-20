import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Cash & Bank", type: "ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" },
  { code: "1200", name: "Inventory", type: "ASSET" },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
  { code: "3000", name: "Owner Equity", type: "EQUITY" },
  { code: "4000", name: "Sales Revenue", type: "REVENUE" },
  { code: "4100", name: "Service Revenue", type: "REVENUE" },
  { code: "5000", name: "Cost of Sales", type: "EXPENSE" },
  { code: "5100", name: "Operating Expenses", type: "EXPENSE" },
  { code: "5200", name: "Payroll Expenses", type: "EXPENSE" },
];

export async function GET() {
  const auth = await requirePermission("erp.finance.view");
  if (auth.error) return auth.error;

  let accounts = await prisma.chartOfAccount.findMany({
    orderBy: { code: "asc" },
  });

  if (accounts.length === 0) {
    await prisma.chartOfAccount.createMany({ data: DEFAULT_ACCOUNTS });
    accounts = await prisma.chartOfAccount.findMany({ orderBy: { code: "asc" } });
  }

  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.finance.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(2),
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    parentCode: z.string().optional().nullable(),
    description: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  }

  const account = await prisma.chartOfAccount.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      type: parsed.data.type,
      parentCode: parsed.data.parentCode || null,
      description: parsed.data.description,
      active: true,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "FINANCE",
    entityType: "ChartOfAccount",
    entityId: account.id,
    summary: `COA account ${account.code} · ${account.name}`,
  });

  return NextResponse.json({ account }, { status: 201 });
}
