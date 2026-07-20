import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const status = new URL(request.url).searchParams.get("status");
  const pages = await prisma.cmsPage.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    slug: z.string().min(1),
    title: z.string().min(2),
    pageType: z.string().optional(),
    locale: z.string().optional(),
    excerpt: z.string().optional(),
    bodyHtml: z.string().optional(),
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const status = parsed.data.status ?? "DRAFT";
  const page = await prisma.cmsPage.create({
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
    entityType: "CmsPage",
    entityId: page.id,
    summary: `CMS page created: ${page.slug}`,
  });

  return NextResponse.json({ page }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    id: z.string(),
    title: z.string().optional(),
    excerpt: z.string().optional().nullable(),
    bodyHtml: z.string().optional().nullable(),
    heroTitle: z.string().optional().nullable(),
    heroSubtitle: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.cmsPage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await prisma.cmsPage.update({
    where: { id },
    data: {
      ...rest,
      version: existing.version + 1,
      publishedAt:
        rest.status === "PUBLISHED"
          ? existing.publishedAt ?? new Date()
          : rest.status === "ARCHIVED" || rest.status === "DRAFT"
            ? existing.publishedAt
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
    entityType: "CmsPage",
    entityId: page.id,
    summary: `CMS page updated: ${page.slug} v${page.version}`,
  });

  return NextResponse.json({ page });
}
