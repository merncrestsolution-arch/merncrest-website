import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";
import { publishAttendanceSync } from "@/lib/platform/publish";
import { randomBytes } from "crypto";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** ESS attendance: punch in/out + history + QR token */
export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  const records = await prisma.attendanceRecord.findMany({
    where: { employeeId: employee.id },
    orderBy: { workDate: "desc" },
    take: 40,
  });

  const today = await prisma.attendanceRecord.findFirst({
    where: { employeeId: employee.id, workDate: startOfDay() },
  });

  return NextResponse.json({
    employee: {
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      faceEnrolled: Boolean(employee.faceEnrollmentHash),
      hasSignature: Boolean(employee.signatureJson),
    },
    records,
    today,
  });
}

const punchSchema = z.object({
  action: z.enum(["IN", "OUT", "QR_TOKEN", "ENROLL_FACE"]),
  notes: z.string().max(500).optional(),
  token: z.string().optional(),
  verifyMethod: z.enum(["MANUAL", "GPS", "QR", "FACE"]).optional(),
  faceHash: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = punchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid punch" }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({
    where: { userId: auth.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  if (parsed.data.action === "QR_TOKEN") {
    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.attendancePunchToken.create({
      data: { employeeId: employee.id, token, expiresAt },
    });
    return NextResponse.json({ token, expiresAt });
  }

  if (parsed.data.action === "ENROLL_FACE") {
    if (!parsed.data.faceHash) {
      return NextResponse.json({ error: "faceHash required" }, { status: 400 });
    }
    const hash = parsed.data.faceHash.toLowerCase();
    await prisma.employee.update({
      where: { id: employee.id },
      data: { faceEnrollmentHash: hash },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "HR",
      entityType: "Employee",
      entityId: employee.id,
      summary: "Face enrollment for ESS attendance",
    });
    return NextResponse.json({ enrolled: true });
  }

  if (parsed.data.verifyMethod === "FACE" || parsed.data.faceHash) {
    if (!parsed.data.faceHash) {
      return NextResponse.json({ error: "faceHash required for face verification" }, { status: 400 });
    }
    const hash = parsed.data.faceHash.toLowerCase();
    if (!employee.faceEnrollmentHash) {
      return NextResponse.json({ error: "Enroll your face first" }, { status: 400 });
    }
    if (employee.faceEnrollmentHash !== hash) {
      return NextResponse.json({ error: "Face verification failed" }, { status: 403 });
    }
  }

  if (parsed.data.token) {
    const row = await prisma.attendancePunchToken.findFirst({
      where: {
        token: parsed.data.token,
        employeeId: employee.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired QR token" }, { status: 400 });
    }
    await prisma.attendancePunchToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
  }

  const day = startOfDay();
  let record = await prisma.attendanceRecord.findFirst({
    where: { employeeId: employee.id, workDate: day },
  });

  const verifyMethod = parsed.data.verifyMethod ?? (parsed.data.token ? "QR" : "MANUAL");
  const now = new Date();
  if (parsed.data.action === "IN") {
    if (record?.checkIn) {
      return NextResponse.json({ error: "Already punched in today" }, { status: 400 });
    }
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    record = record
      ? await prisma.attendanceRecord.update({
          where: { id: record.id },
          data: {
            checkIn: now,
            status: late ? "LATE" : "PRESENT",
            notes: parsed.data.notes,
            verifyMethod,
            userId: auth.user.id,
          },
        })
      : await prisma.attendanceRecord.create({
          data: {
            employeeId: employee.id,
            userId: auth.user.id,
            workDate: day,
            checkIn: now,
            status: late ? "LATE" : "PRESENT",
            notes: parsed.data.notes,
            verifyMethod,
          },
        });
  } else if (parsed.data.action === "OUT") {
    if (!record?.checkIn) {
      return NextResponse.json({ error: "Punch in first" }, { status: 400 });
    }
    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        notes: parsed.data.notes || record.notes,
        verifyMethod,
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid punch action" }, { status: 400 });
  }

  void writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "HR",
    entityType: "AttendanceRecord",
    entityId: record.id,
    summary: `Attendance punch ${parsed.data.action}`,
  });

  if (parsed.data.action === "IN" || parsed.data.action === "OUT") {
    const { notifyAttendanceWhatsApp } = await import("@/lib/crm/whatsapp-notify");
    void notifyAttendanceWhatsApp({
      userId: auth.user.id,
      action: parsed.data.action,
    });
  }

  publishAttendanceSync(auth.user.id);

  return NextResponse.json({ record });
}
