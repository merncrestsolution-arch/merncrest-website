import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { z } from "zod";

/** Admin catalog — includes provider cost for profit visibility */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const products = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { provider: { select: { id: true, name: true, code: true } } },
  });

  return NextResponse.json({ products });
}

const patchSchema = z.object({
  id: z.string().min(1),
  marketingTitle: z.string().optional().nullable(),
  marketingBanner: z.string().optional().nullable(),
  marketingBody: z.string().optional().nullable(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** Edit marketing content overlays on synced products */
export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data,
  });

  return NextResponse.json({ product });
}
