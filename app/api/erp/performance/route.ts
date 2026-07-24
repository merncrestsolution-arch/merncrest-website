import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";
import {
  buildPerformanceSnapshot,
  buildReport,
  evaluatePerformanceAlerts,
  type ReportKind,
} from "@/lib/erp/performance";

export async function GET(request: Request) {
  const perm = await requirePermission(["erp.analytics.view", "erp.hr.view"]);
  const staff = perm.error ? await requireStaff() : null;
  if (perm.error && staff?.error) return perm.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "dashboard";
  const days = Number(searchParams.get("days") || 30);

  if (view === "dashboard") {
    const snapshot = await buildPerformanceSnapshot(Number.isFinite(days) ? days : 30);
    return NextResponse.json({ snapshot });
  }
  if (view === "report") {
    const kind = (searchParams.get("kind") || "sales") as ReportKind;
    const report = await buildReport(kind, Number.isFinite(days) ? days : 30);
    return NextResponse.json({ report });
  }
  if (view === "benchmarks") {
    const benchmarks = await prisma.metricBenchmark.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ benchmarks });
  }
  if (view === "metrics") {
    const metrics = await prisma.customMetric.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ metrics });
  }
  if (view === "alerts") {
    const alerts = await prisma.performanceAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { fullName: true } } },
    });
    return NextResponse.json({ alerts });
  }
  if (view === "reviews") {
    const reviews = await prisma.performanceReview.findMany({
      include: {
        subject: { select: { fullName: true } },
        reviewer: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    });
    return NextResponse.json({ reviews });
  }

  return NextResponse.json({ error: "Unknown view" }, { status: 400 });
}

const postSchema = z.object({
  action: z.enum([
    "kpi_target",
    "kpi_entry",
    "custom_metric",
    "benchmark",
    "alert",
    "manager_review",
    "run_alerts",
  ]),
  name: z.string().optional(),
  metricKey: z.string().optional(),
  targetValue: z.number().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  periodLabel: z.string().optional(),
  userId: z.string().optional(),
  formulaKey: z.string().optional(),
  departmentId: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["INDUSTRY", "INTERNAL", "TEAM"]).optional(),
  threshold: z.number().optional(),
  direction: z.enum(["BELOW", "ABOVE"]).optional(),
  reviewId: z.string().optional(),
  managerScore: z.number().int().min(1).max(5).optional(),
  managerNotes: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission([
    "erp.analytics.view",
    "erp.hr.manage",
    "erp.permissions.manage",
  ]);
  if (auth.error) return auth.error;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "run_alerts") {
    const result = await evaluatePerformanceAlerts();
    return NextResponse.json(result);
  }

  if (d.action === "kpi_target" && d.name && d.metricKey && d.targetValue != null && d.userId) {
    const row = await prisma.kpiTarget.create({
      data: {
        userId: d.userId,
        name: d.name,
        metricKey: d.metricKey,
        targetValue: d.targetValue,
        unit: d.unit,
        periodLabel: d.periodLabel || new Date().toISOString().slice(0, 7),
      },
    });
    return NextResponse.json({ target: row }, { status: 201 });
  }

  if (d.action === "kpi_entry" && d.metricKey && d.value != null && d.userId) {
    const row = await prisma.kpiEntry.create({
      data: { userId: d.userId, metricKey: d.metricKey, value: d.value, notes: d.description },
    });
    return NextResponse.json({ entry: row }, { status: 201 });
  }

  if (d.action === "custom_metric" && d.name && d.formulaKey) {
    const row = await prisma.customMetric.create({
      data: {
        name: d.name,
        formulaKey: d.formulaKey,
        departmentId: d.departmentId,
        unit: d.unit,
        description: d.description,
        createdById: auth.user.id,
      },
    });
    return NextResponse.json({ metric: row }, { status: 201 });
  }

  if (d.action === "benchmark" && d.metricKey && d.value != null) {
    const row = await prisma.metricBenchmark.create({
      data: {
        metricKey: d.metricKey,
        value: d.value,
        source: d.source || "INTERNAL",
        periodLabel: d.periodLabel || new Date().toISOString().slice(0, 7),
        notes: d.description,
      },
    });
    return NextResponse.json({ benchmark: row }, { status: 201 });
  }

  if (d.action === "alert" && d.metricKey && d.threshold != null) {
    const row = await prisma.performanceAlert.create({
      data: {
        userId: d.userId,
        departmentId: d.departmentId,
        metricKey: d.metricKey,
        threshold: d.threshold,
        direction: d.direction || "BELOW",
      },
    });
    return NextResponse.json({ alert: row }, { status: 201 });
  }

  if (d.action === "manager_review" && d.reviewId && d.managerScore != null) {
    const review = await prisma.performanceReview.update({
      where: { id: d.reviewId },
      data: {
        managerScore: d.managerScore,
        managerNotes: d.managerNotes,
        reviewerId: auth.user.id,
        status: "MANAGER_DONE",
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "PERFORMANCE",
      entityType: "PerformanceReview",
      entityId: review.id,
      summary: `Manager review score ${d.managerScore}`,
    });
    return NextResponse.json({ review });
  }

  return NextResponse.json({ error: "Incomplete payload" }, { status: 400 });
}
