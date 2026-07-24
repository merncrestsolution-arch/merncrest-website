import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/**
 * PUBLIC knowledge-base read API + minimal admin writes.
 * GET (public): published articles only. ?slug= returns a single article.
 *   ?category=, ?q= (search) supported for the list.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const article = await prisma.knowledgeArticle.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ article });
  }

  const category = url.searchParams.get("category") || undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      status: "PUBLISHED",
      ...(category && category !== "All" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
              { tagsJson: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      tagsJson: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  const categories = await prisma.knowledgeArticle.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["category"],
    select: { category: true },
  });

  return NextResponse.json({
    articles,
    categories: categories.map((c) => c.category).filter(Boolean),
  });
}

const upsertSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(2),
  body: z.string().min(1),
  category: z.string().optional(),
  tagsJson: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid article" }, { status: 400 });
  }

  const status = parsed.data.status ?? "DRAFT";
  const article = await prisma.knowledgeArticle.create({
    data: {
      ...parsed.data,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "CMS",
    entityType: "KnowledgeArticle",
    entityId: article.id,
    summary: `KB article created: ${article.slug}`,
  });

  return NextResponse.json({ article }, { status: 201 });
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
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const article = await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      ...rest,
      publishedAt:
        rest.status === "PUBLISHED"
          ? existing.publishedAt ?? new Date()
          : existing.publishedAt,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "CMS",
    entityType: "KnowledgeArticle",
    entityId: article.id,
    summary: `KB article updated: ${article.slug}`,
  });

  return NextResponse.json({ article });
}
