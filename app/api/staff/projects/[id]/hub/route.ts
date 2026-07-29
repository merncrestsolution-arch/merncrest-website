import { requireStaff } from "@/lib/commerce";
import { apiError, apiSuccess } from "@/lib/api/envelope";
import { hasStaffPermission } from "@/lib/staff/permissions";
import { loadProjectHub } from "@/lib/staff/project-hub";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const canView = await hasStaffPermission(auth.user, "projects.view");
  if (!canView) return apiError("FORBIDDEN", "Missing projects.view permission", 403);

  const { id } = await context.params;
  const hub = await loadProjectHub(id);
  if (!hub) return apiError("NOT_FOUND", "Project not found", 404);

  return apiSuccess(hub);
}
