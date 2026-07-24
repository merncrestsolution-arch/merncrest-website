import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

/**
 * PUBLIC blog read API + minimal admin writes.
 * GET (public): published posts only. ?slug= returns a single post.
 *   ?category=, ?q= (search), ?take=, ?skip= supported for the list.
 * POST/PATCH (admin only): create/update, audit-logged.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  }

  const category = url.searchParams.get("category") || undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const take = Math.min(Number(url.searchParams.get("take")) || 50, 100);
  const skip = Number(url.searchParams.get("skip")) || 0;

  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      ...(category && category !== "All" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { excerpt: { contains: q, mode: "insensitive" } },
              { tagsJson: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
    skip,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      author: true,
      category: true,
      readTime: true,
      tagsJson: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  const categories = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    distinct: ["category"],
    select: { category: true },
  });

  return NextResponse.json({
    posts,
    categories: categories.map((c) => c.category).filter(Boolean),
  });
}

const upsertSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(2),
  excerpt: z.string().optional().nullable(),
  bodyHtml: z.string().min(1),
  coverImageUrl: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  category: z.string().optional(),
  readTime: z.number().int().min(1).max(120).optional(),
  tagsJson: z.string().optional().nullable(),
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
    return NextResponse.json({ error: "Invalid blog post" }, { status: 400 });
  }

  const status = parsed.data.status ?? "DRAFT";
  const post = await prisma.blogPost.create({
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
    entityType: "BlogPost",
    entityId: post.id,
    summary: `Blog post created: ${post.slug}`,
  });

  return NextResponse.json({ post }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const schema = upsertSchema.partial().extend({ id: z.string() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.blogPost.update({
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
    entityType: "BlogPost",
    entityId: post.id,
    summary: `Blog post updated: ${post.slug}`,
  });

  return NextResponse.json({ post });
}
