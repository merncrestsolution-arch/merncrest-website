import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";

/** Create a new document version (DMS) */
export async function POST(request: Request) {
  const auth = await requirePermission("erp.dms.manage");
  if (auth.error) return auth.error;

  const schema = z.object({
    documentId: z.string(),
    fileUrl: z.string().optional(),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({ where: { id: parsed.data.documentId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextVersion = doc.version + 1;
  const [version] = await prisma.$transaction([
    prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: nextVersion,
        fileUrl: parsed.data.fileUrl || doc.fileUrl,
        notes: parsed.data.notes,
        uploaderId: auth.user.id,
      },
    }),
    prisma.document.update({
      where: { id: doc.id },
      data: {
        version: nextVersion,
        fileUrl: parsed.data.fileUrl || doc.fileUrl,
      },
    }),
  ]);

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "DMS",
    entityType: "Document",
    entityId: doc.id,
    summary: `Document version ${nextVersion}`,
  });

  return NextResponse.json({ version }, { status: 201 });
}
