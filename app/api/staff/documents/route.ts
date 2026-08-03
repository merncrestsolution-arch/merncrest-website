import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";

/** ESS self-service HR documents (upload metadata after file upload). */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: employee.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return NextResponse.json({ documents });
}

const createSchema = z.object({
  title: z.string().min(2).max(160),
  docType: z.enum(["OFFER", "AGREEMENT", "ID_CARD", "CERTIFICATE", "OTHER"]).default("OTHER"),
  fileUrl: z.string().min(1).max(2000),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid document" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  const doc = await prisma.employeeDocument.create({
    data: {
      employeeId: employee.id,
      title: parsed.data.title,
      docType: parsed.data.docType,
      fileUrl: parsed.data.fileUrl,
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
    summary: `ESS upload: ${doc.title}`,
  });

  return NextResponse.json({ document: doc }, { status: 201 });
}
