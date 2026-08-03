import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPermissions } from "@/lib/erp/permissions";
import { prisma } from "@/lib/db";

/** Current mobile session + permissions + employee profile. */
export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [permissions, employee] = await Promise.all([
    getUserPermissions(user),
    prisma.employee.findFirst({
      where: { userId: user.id },
      include: { department: true },
    }),
  ]);

  return NextResponse.json({
    user,
    permissions: Array.from(permissions),
    employee: employee
      ? {
          id: employee.id,
          fullName: employee.fullName,
          jobTitle: employee.jobTitle,
          department: employee.department?.name ?? null,
        }
      : null,
  });
}
