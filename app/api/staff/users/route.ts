import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { isAdminRole } from "@/lib/auth";

/** Staff directory search — for project team assignment and similar pickers */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canPick =
    isAdminRole(auth.user.role) || (await hasStaffPermission(auth.user, "team.manage"));
  if (!canPick) return apiError("FORBIDDEN", "Missing team.manage permission", 403);

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["STAFF", "ADMIN", "OWNER"] },
      ...(q.length >= 2
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, fullName: true, email: true, role: true },
    orderBy: { fullName: "asc" },
    take: q.length >= 2 ? 12 : 40,
  });

  return apiSuccess(staff);
}
