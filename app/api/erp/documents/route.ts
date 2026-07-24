import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { docsExpiringSoon, searchDocuments } from "@/lib/erp/dms";

export async function GET(request: Request) {
  const auth = await requirePermission(["erp.dms.view", "erp.dms.manage"]);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "list";
  const q = searchParams.get("q") || "";

  if (view === "expiring") {
    const documents = await docsExpiringSoon(30);
    return NextResponse.json({ documents });
  }
  if (view === "templates") {
    const templates = await prisma.docTemplate.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ templates });
  }
  if (view === "knowledge") {
    const articles = await prisma.knowledgeArticle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { author: { select: { fullName: true } } },
    });
    return NextResponse.json({ articles });
  }
  if (view === "workflows") {
    const workflows = await prisma.processWorkflow.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ workflows });
  }
  if (view === "folders") {
    const docs = await prisma.document.groupBy({
      by: ["folder"],
      _count: { _all: true },
    });
    return NextResponse.json({
      folders: docs.map((d) => ({ folder: d.folder, count: d._count._all })),
    });
  }

  const documents = await searchDocuments(q, 80);
  return NextResponse.json({ documents });
}

const postSchema = z.object({
  action: z
    .enum(["document", "template", "knowledge", "workflow", "ocr", "sign"])
    .optional(),
  title: z.string().min(2).optional(),
  category: z.string().optional(),
  folder: z.string().optional(),
  fileUrl: z.string().optional(),
  templateKey: z.string().optional(),
  aclJson: z.string().optional(),
  expiresAt: z.string().optional(),
  ocrText: z.string().optional(),
  key: z.string().optional(),
  name: z.string().optional(),
  bodyHtml: z.string().optional(),
  slug: z.string().optional(),
  body: z.string().optional(),
  tagsJson: z.string().optional(),
  status: z.string().optional(),
  stepsJson: z.string().optional(),
  diagramJson: z.string().optional(),
  description: z.string().optional(),
  id: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.dms.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const d = parsed.data;
  const action = d.action || "document";

  if (action === "document" && d.title) {
    const doc = await prisma.document.create({
      data: {
        docNumber: nextNumber("DOC"),
        title: d.title,
        category: d.category || "General",
        folder: d.folder || "General",
        fileUrl: d.fileUrl,
        templateKey: d.templateKey,
        aclJson: d.aclJson,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
        ocrText: d.ocrText,
        uploaderId: auth.user.id,
        status: "PENDING",
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "DMS",
      entityType: "Document",
      entityId: doc.id,
      summary: `Document ${doc.docNumber}`,
    });
    return NextResponse.json({ document: doc }, { status: 201 });
  }

  if (action === "template" && d.key && d.name) {
    const template = await prisma.docTemplate.create({
      data: {
        key: d.key,
        name: d.name,
        category: d.category || "General",
        bodyHtml: d.bodyHtml,
        fileUrl: d.fileUrl,
      },
    });
    return NextResponse.json({ template }, { status: 201 });
  }

  if (action === "knowledge" && d.title && d.slug && d.body) {
    const article = await prisma.knowledgeArticle.create({
      data: {
        slug: d.slug,
        title: d.title,
        body: d.body,
        category: d.category || "FAQ",
        tagsJson: d.tagsJson,
        status: d.status || "DRAFT",
        authorId: auth.user.id,
        publishedAt: d.status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    return NextResponse.json({ article }, { status: 201 });
  }

  if (action === "workflow" && d.name && d.stepsJson) {
    const workflow = await prisma.processWorkflow.create({
      data: {
        name: d.name,
        description: d.description,
        stepsJson: d.stepsJson,
        diagramJson: d.diagramJson,
      },
    });
    return NextResponse.json({ workflow }, { status: 201 });
  }

  if (action === "ocr" && d.id && d.ocrText) {
    const document = await prisma.document.update({
      where: { id: d.id },
      data: { ocrText: d.ocrText },
    });
    return NextResponse.json({ document });
  }

  if (action === "sign" && d.id) {
    const document = await prisma.document.update({
      where: { id: d.id },
      data: { signedAt: new Date(), signedById: auth.user.id, status: "APPROVED" },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "APPROVE",
      module: "DMS",
      entityType: "Document",
      entityId: document.id,
      summary: `Digitally signed ${document.docNumber}`,
    });
    return NextResponse.json({ document });
  }

  return NextResponse.json({ error: "Incomplete" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.dms.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const doc = await prisma.document.update({
    where: { id: body.id },
    data: {
      status: body.status,
      folder: body.folder,
      aclJson: body.aclJson,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : body.expiresAt === null ? null : undefined,
      version: body.bumpVersion ? { increment: 1 } : undefined,
    },
  });
  if (body.bumpVersion && body.fileUrl) {
    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        version: doc.version,
        fileUrl: body.fileUrl,
        notes: body.notes,
        uploaderId: auth.user.id,
      },
    });
  }
  return NextResponse.json({ document: doc });
}
