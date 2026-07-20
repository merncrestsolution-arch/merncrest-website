import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireStaffOrAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireStaffOrAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");
  const kind = searchParams.get("kind");
  const q = searchParams.get("q")?.trim();

  const assets = await prisma.mediaAsset.findMany({
    where: {
      deletedAt: null,
      AND: [
        folder ? { folder } : {},
        kind ? { kind } : {},
        q
          ? {
              OR: [
                { filename: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { altText: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const folders = await prisma.mediaAsset.groupBy({
    by: ["folder"],
    where: { deletedAt: null },
    _count: true,
  });

  return NextResponse.json({ assets, folders });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    filename: z.string().min(1),
    title: z.string().optional(),
    kind: z
      .enum(["IMAGE", "VIDEO", "PDF", "DOCUMENT", "ICON", "LOGO", "BANNER", "OTHER"])
      .optional(),
    url: z.string().url(),
    folder: z.string().optional(),
    mimeType: z.string().optional(),
    altText: z.string().optional(),
    sizeBytes: z.number().int().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid media asset" }, { status: 400 });
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: parsed.data.filename,
      title: parsed.data.title,
      kind: parsed.data.kind ?? "IMAGE",
      url: parsed.data.url,
      folder: parsed.data.folder ?? "general",
      mimeType: parsed.data.mimeType,
      altText: parsed.data.altText,
      sizeBytes: parsed.data.sizeBytes,
      uploadedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "MEDIA",
    entityType: "MediaAsset",
    entityId: asset.id,
    summary: `Media uploaded: ${asset.filename}`,
  });

  return NextResponse.json({ asset }, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "DELETE",
    module: "MEDIA",
    entityType: "MediaAsset",
    entityId: asset.id,
    summary: `Media soft-deleted: ${asset.filename}`,
  });

  return NextResponse.json({ ok: true });
}
