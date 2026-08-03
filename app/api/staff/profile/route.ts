import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";

/** ESS profile — signature + face enrollment metadata for MernCrest Connect */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      signatureJson: true,
      faceEnrollmentHash: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  return NextResponse.json({
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      hasSignature: Boolean(employee.signatureJson),
      faceEnrolled: Boolean(employee.faceEnrollmentHash),
    },
    signatureJson: employee.signatureJson,
  });
}

const patchSchema = z.object({
  signatureJson: z.string().max(120_000).nullable().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  if ("signatureJson" in parsed.data) {
    await prisma.employee.update({
      where: { id: employee.id },
      data: { signatureJson: parsed.data.signatureJson },
    });

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "HR",
      entityType: "Employee",
      entityId: employee.id,
      summary: "ESS digital signature updated",
    });
  }

  const updated = await prisma.employee.findUnique({
    where: { id: employee.id },
    select: { signatureJson: true, faceEnrollmentHash: true },
  });

  return NextResponse.json({
    ok: true,
    hasSignature: Boolean(updated?.signatureJson),
    faceEnrolled: Boolean(updated?.faceEnrollmentHash),
  });
}
