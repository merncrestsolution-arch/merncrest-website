import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";

/** Staff security preferences (2FA flag) */
export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!["STAFF", "ADMIN", "OWNER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { twoFactorEnabled: true, email: true },
  });
  return NextResponse.json({ twoFactorEnabled: user?.twoFactorEnabled ?? false });
}

const patchSchema = z.object({
  twoFactorEnabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  if (!["STAFF", "ADMIN", "OWNER"].includes(auth.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: { twoFactorEnabled: parsed.data.twoFactorEnabled },
    select: { twoFactorEnabled: true },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "SETTINGS",
    module: "SYSTEM",
    entityType: "User",
    entityId: auth.user.id,
    summary: `2FA ${user.twoFactorEnabled ? "enabled" : "disabled"}`,
  });

  return NextResponse.json({ twoFactorEnabled: user.twoFactorEnabled });
}
