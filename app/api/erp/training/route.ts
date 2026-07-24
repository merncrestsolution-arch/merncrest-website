import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";
import { competencyMap, trainingRoi } from "@/lib/erp/training";
import { notifyUser } from "@/lib/support/notify";

export async function GET(request: Request) {
  const auth = await requirePermission(["erp.hr.view", "erp.analytics.view"]);
  if (auth.error) {
    const staff = await requireStaff();
    if (staff.error) return auth.error;
    // ESS self view
    const records = await prisma.trainingRecord.findMany({
      where: { userId: staff.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const certs = await prisma.employeeCertification.findMany({
      where: { employee: { userId: staff.user.id } },
      take: 20,
    });
    const skills = await competencyMap(staff.user.id);
    const content = await prisma.trainingContent.findMany({
      where: { active: true },
      take: 40,
    });
    return NextResponse.json({ records, certs, skills, content, self: true });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "all";

  if (view === "roi") {
    const roi = await trainingRoi(90);
    return NextResponse.json({ roi });
  }
  if (view === "content") {
    const content = await prisma.trainingContent.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return NextResponse.json({ content });
  }
  if (view === "pips") {
    const pips = await prisma.performanceImprovementPlan.findMany({
      include: {
        user: { select: { fullName: true } },
        manager: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    return NextResponse.json({ pips });
  }

  const [records, content, certs, roi] = await Promise.all([
    prisma.trainingRecord.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.trainingContent.findMany({ where: { active: true }, take: 40 }),
    prisma.employeeCertification.findMany({
      include: { employee: { select: { fullName: true } } },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
    trainingRoi(90),
  ]);

  return NextResponse.json({ records, content, certs, roi });
}

const postSchema = z.object({
  action: z.enum([
    "enroll",
    "content",
    "progress",
    "cert",
    "assess",
    "pip",
    "assign_mentor",
  ]),
  userId: z.string().optional(),
  title: z.string().optional(),
  provider: z.string().optional(),
  contentUrl: z.string().optional(),
  skillKey: z.string().optional(),
  hours: z.number().optional(),
  costCents: z.number().int().optional(),
  scheduledAt: z.string().optional(),
  trainerId: z.string().optional(),
  menteeOfId: z.string().optional(),
  url: z.string().optional(),
  category: z.string().optional(),
  recordId: z.string().optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  score: z.number().optional(),
  status: z.string().optional(),
  employeeId: z.string().optional(),
  name: z.string().optional(),
  issuer: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  goalsJson: z.string().optional(),
  managerId: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission(["erp.hr.manage", "erp.hr.view"]);
  if (auth.error) return auth.error;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "content" && d.title) {
    const content = await prisma.trainingContent.create({
      data: {
        title: d.title,
        provider: d.provider,
        url: d.url || d.contentUrl,
        hours: d.hours,
        skillKey: d.skillKey,
        category: d.category || "GENERAL",
      },
    });
    return NextResponse.json({ content }, { status: 201 });
  }

  if (d.action === "enroll" && d.title && d.userId) {
    const record = await prisma.trainingRecord.create({
      data: {
        userId: d.userId,
        title: d.title,
        provider: d.provider,
        contentUrl: d.contentUrl || d.url,
        skillKey: d.skillKey,
        hours: d.hours,
        costCents: d.costCents || 0,
        scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : undefined,
        trainerId: d.trainerId,
        menteeOfId: d.menteeOfId,
        status: "PLANNED",
      },
    });
    await notifyUser({
      userId: d.userId,
      title: `Training enrolled: ${d.title}`,
      body: d.provider ? `Provider: ${d.provider}` : "Open System → Training",
      category: "SYSTEM",
      href: "/staff/training",
    });
    return NextResponse.json({ record }, { status: 201 });
  }

  if (d.action === "progress" && d.recordId) {
    const pct = d.progressPct ?? 0;
    const record = await prisma.trainingRecord.update({
      where: { id: d.recordId },
      data: {
        progressPct: pct,
        score: d.score,
        status: pct >= 100 ? "COMPLETED" : pct > 0 ? "IN_PROGRESS" : d.status,
        completedAt: pct >= 100 ? new Date() : undefined,
      },
    });
    return NextResponse.json({ record });
  }

  if (d.action === "cert" && d.employeeId && d.name) {
    const cert = await prisma.employeeCertification.create({
      data: {
        employeeId: d.employeeId,
        name: d.name,
        issuer: d.issuer,
        issuedAt: d.issuedAt ? new Date(d.issuedAt) : new Date(),
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : undefined,
      },
    });
    return NextResponse.json({ cert }, { status: 201 });
  }

  if (d.action === "assess" && d.userId && d.skillKey && d.score != null) {
    const assessment = await prisma.skillAssessment.create({
      data: {
        userId: d.userId,
        skillKey: d.skillKey,
        score: d.score,
        assessorId: auth.user.id,
      },
    });
    return NextResponse.json({ assessment }, { status: 201 });
  }

  if (d.action === "pip" && d.userId && d.title) {
    const pip = await prisma.performanceImprovementPlan.create({
      data: {
        userId: d.userId,
        managerId: d.managerId || auth.user.id,
        title: d.title,
        goalsJson: d.goalsJson,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
      },
    });
    await notifyUser({
      userId: d.userId,
      title: `PIP started: ${d.title}`,
      body: "Review goals with your manager.",
      category: "SYSTEM",
      href: "/staff/performance",
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "TRAINING",
      entityType: "PerformanceImprovementPlan",
      entityId: pip.id,
      summary: pip.title,
    });
    return NextResponse.json({ pip }, { status: 201 });
  }

  if (d.action === "assign_mentor" && d.recordId && d.menteeOfId) {
    const record = await prisma.trainingRecord.update({
      where: { id: d.recordId },
      data: { menteeOfId: d.menteeOfId, trainerId: d.trainerId },
    });
    return NextResponse.json({ record });
  }

  return NextResponse.json({ error: "Incomplete" }, { status: 400 });
}
