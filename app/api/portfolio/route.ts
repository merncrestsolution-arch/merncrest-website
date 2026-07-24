import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/**
 * PUBLIC portfolio / case-study read API + minimal admin writes.
 * GET (public): published case studies only. ?slug= returns a single study.
 *   ?featured=1, ?industry=, ?take= supported for the list.
 * Only real, approved client work is published here (no fabricated samples).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const study = await prisma.caseStudy.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!study) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ study });
  }

  const featured = url.searchParams.get("featured");
  const industry = url.searchParams.get("industry") || undefined;
  const take = Math.min(Number(url.searchParams.get("take")) || 60, 100);

  const studies = await prisma.caseStudy.findMany({
    where: {
      status: "PUBLISHED",
      ...(featured === "1" ? { featured: true } : {}),
      ...(industry && industry !== "All" ? { industry } : {}),
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });

  return NextResponse.json({ studies });
}

const upsertSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(2),
  excerpt: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  category: z.string().optional(),
  techJson: z.string().optional().nullable(),
  problem: z.string().optional().nullable(),
  solution: z.string().optional().nullable(),
  resultsJson: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  locale: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid case study" }, { status: 400 });
  }

  const status = parsed.data.status ?? "DRAFT";
  const study = await prisma.caseStudy.create({
    data: {
      ...parsed.data,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      updatedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "CMS",
    entityType: "CaseStudy",
    entityId: study.id,
    summary: `Case study created: ${study.slug}`,
  });

  return NextResponse.json({ study }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const schema = upsertSchema.partial().extend({ id: z.string() });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.caseStudy.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const study = await prisma.caseStudy.update({
    where: { id },
    data: {
      ...rest,
      publishedAt:
        rest.status === "PUBLISHED"
          ? existing.publishedAt ?? new Date()
          : existing.publishedAt,
      updatedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "CMS",
    entityType: "CaseStudy",
    entityId: study.id,
    summary: `Case study updated: ${study.slug}`,
  });

  return NextResponse.json({ study });
}
