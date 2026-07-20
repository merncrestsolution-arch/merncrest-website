import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: {
      AND: [
        role ? { role } : {},
        q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { fullName: { contains: q, mode: "insensitive" } },
                { company: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      company: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { sessions: true, orders: true, tickets: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  return NextResponse.json({ users, counts });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    role: z.enum(["CUSTOMER", "STAFF", "ADMIN", "OWNER"]).optional(),
    fullName: z.string().min(2).optional(),
    company: z.string().optional().nullable(),
    revokeSessions: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid user update" }, { status: 400 });
  }

  if (parsed.data.id === auth.user.id && parsed.data.role && parsed.data.role !== "OWNER" && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot demote your own admin account" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      company: parsed.data.company,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      company: true,
      role: true,
    },
  });

  if (parsed.data.revokeSessions) {
    await prisma.session.deleteMany({ where: { userId: user.id } });
  }

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "ADMIN",
    entityType: "User",
    entityId: user.id,
    summary: `User updated: ${user.email} · role ${user.role}`,
  });

  return NextResponse.json({ user });
}
