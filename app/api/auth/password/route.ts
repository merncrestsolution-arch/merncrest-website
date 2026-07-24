import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { getPasswordMinLength, validatePasswordStrength } from "@/lib/security/auth-policy";
import { writeAuditLog } from "@/lib/erp/audit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const minLen = await getPasswordMinLength();
  const strengthErr = validatePasswordStrength(parsed.data.newPassword, minLen);
  if (strengthErr) {
    return NextResponse.json({ error: strengthErr }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !(await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  await writeAuditLog({
    actorId: user.id,
    actorName: user.fullName,
    action: "PASSWORD_CHANGED",
    module: "AUTH",
    entityType: "User",
    entityId: user.id,
    summary: "Password changed",
  });

  return NextResponse.json({ ok: true });
}
