import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ERP_PERMISSIONS, requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission("erp.permissions.manage");
  if (auth.error) return auth.error;

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      permissions: true,
    },
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json({
    staff,
    available: ERP_PERMISSIONS,
  });
}

const schema = z.object({
  userId: z.string(),
  permission: z.string(),
  action: z.enum(["grant", "revoke"]),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.permissions.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (!ERP_PERMISSIONS.includes(parsed.data.permission as (typeof ERP_PERMISSIONS)[number])) {
    return NextResponse.json({ error: "Unknown permission" }, { status: 400 });
  }

  if (parsed.data.action === "grant") {
    await prisma.staffPermission.upsert({
      where: {
        userId_permission: {
          userId: parsed.data.userId,
          permission: parsed.data.permission,
        },
      },
      update: {},
      create: {
        userId: parsed.data.userId,
        permission: parsed.data.permission,
      },
    });
  } else {
    await prisma.staffPermission.deleteMany({
      where: {
        userId: parsed.data.userId,
        permission: parsed.data.permission,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
