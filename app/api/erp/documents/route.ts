import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.dms.view", "erp.dms.manage"]);
  if (auth.error) return auth.error;

  const documents = await prisma.document.findMany({
    include: { uploader: { select: { fullName: true } } },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.dms.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    title: z.string().min(2),
    category: z.string().min(1),
    fileUrl: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const doc = await prisma.document.create({
    data: {
      docNumber: nextNumber("DOC"),
      title: parsed.data.title,
      category: parsed.data.category,
      fileUrl: parsed.data.fileUrl,
      uploaderId: auth.user.id,
      status: "PENDING",
    },
  });
  return NextResponse.json({ document: doc }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("erp.dms.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const doc = await prisma.document.update({
    where: { id: body.id },
    data: {
      status: body.status,
      version: body.bumpVersion ? { increment: 1 } : undefined,
    },
  });
  return NextResponse.json({ document: doc });
}
