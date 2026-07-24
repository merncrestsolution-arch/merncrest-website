import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";

const schema = z.object({
  employeeId: z.string(),
  title: z.string().min(2),
  docType: z.enum(["OFFER", "AGREEMENT", "ID_CARD", "CERTIFICATE", "OTHER"]),
  fileUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.hr.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid document" }, { status: 400 });

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: parsed.data.employeeId,
      title: parsed.data.title,
      docType: parsed.data.docType,
      fileUrl: parsed.data.fileUrl || null,
      notes: parsed.data.notes,
    },
  });

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "HR",
    entityType: "EmployeeDocument",
    entityId: doc.id,
    summary: `Document: ${doc.title}`,
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
