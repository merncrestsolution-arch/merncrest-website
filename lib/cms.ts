import { prisma } from "@/lib/db";

/**
 * Server-side data access for public marketing CMS content.
 * lib/data/* is only the seed source; runtime reads come from the DB here.
 */

// ---- Blog ----
export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function getRelatedPosts(category: string, excludeSlug: string, take = 3) {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", category, slug: { not: excludeSlug } },
    orderBy: [{ publishedAt: "desc" }],
    take,
  });
}

export async function getAllPostSlugs() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.map((p) => p.slug);
}

// ---- Knowledge base ----
export async function getPublishedArticles() {
  return prisma.knowledgeArticle.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    take: 300,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.knowledgeArticle.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function getAllArticleSlugs() {
  const rows = await prisma.knowledgeArticle.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// ---- Portfolio / case studies ----
export async function getPublishedCaseStudies(opts?: { featured?: boolean }) {
  return prisma.caseStudy.findMany({
    where: { status: "PUBLISHED", ...(opts?.featured ? { featured: true } : {}) },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getCaseStudyBySlug(slug: string) {
  return prisma.caseStudy.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function getAllCaseStudySlugs() {
  const rows = await prisma.caseStudy.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

// ---- Careers ----
export async function getOpenJobs() {
  const openings = await prisma.jobOpening.findMany({
    where: { status: "OPEN" },
    orderBy: [{ isInternship: "asc" }, { createdAt: "desc" }],
  });
  return {
    roles: openings.filter((o) => !o.isInternship),
    internships: openings.filter((o) => o.isInternship),
    all: openings,
  };
}
