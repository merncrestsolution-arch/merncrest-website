import { prisma } from "@/lib/db";

export type DocAcl = {
  view?: string[];
  edit?: string[];
  download?: string[];
};

export function parseAcl(aclJson?: string | null): DocAcl {
  if (!aclJson) return {};
  try {
    return JSON.parse(aclJson) as DocAcl;
  } catch {
    return {};
  }
}

export function canAccessDoc(
  acl: DocAcl,
  userId: string,
  action: "view" | "edit" | "download",
  isManager: boolean
) {
  if (isManager) return true;
  const list = acl[action] || acl.view || [];
  if (list.length === 0) return true; // open by default inside DMS
  return list.includes(userId);
}

export async function searchDocuments(q: string, take = 40) {
  const term = q.trim();
  if (!term) {
    return prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      include: { uploader: { select: { fullName: true } }, versions: { take: 3, orderBy: { version: "desc" } } },
    });
  }
  return prisma.document.findMany({
    where: {
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { folder: { contains: term, mode: "insensitive" } },
        { ocrText: { contains: term, mode: "insensitive" } },
        { docNumber: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take,
    include: { uploader: { select: { fullName: true } }, versions: { take: 3, orderBy: { version: "desc" } } },
  });
}

export async function docsExpiringSoon(days = 30) {
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return prisma.document.findMany({
    where: {
      expiresAt: { lte: until, gte: new Date() },
      status: { not: "ARCHIVED" },
    },
    orderBy: { expiresAt: "asc" },
    take: 40,
  });
}
