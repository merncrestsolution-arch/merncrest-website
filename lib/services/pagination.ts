import { SL_TIMEZONE } from "@/lib/timezone";

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
) {
  const page = Math.max(1, Number(searchParams.get("page") ?? defaults.page ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? defaults.limit ?? 20))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(page: number, total: number, limit: number) {
  return { page, total, limit };
}

export { SL_TIMEZONE };
