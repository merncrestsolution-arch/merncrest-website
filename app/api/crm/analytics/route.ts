import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { getStaffScope, crmLeadScopeWhere } from "@/lib/erp/staff-scope";

/** CRM KPIs scoped by staff hierarchy + revenue dimensions */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const scope = await getStaffScope(auth.user);
  const where = crmLeadScopeWhere(scope) as object | undefined;
  const { searchParams } = new URL(request.url);
  const report = searchParams.get("report"); // optional preset

  const [leads, wonValue, bySource, byStage, closed, orders, invoices] = await Promise.all([
    prisma.crmLead.findMany({
      where,
      select: {
        id: true,
        stage: true,
        valueCents: true,
        leadScore: true,
        source: true,
        createdAt: true,
        wonReason: true,
        lostReason: true,
        fullName: true,
        company: true,
      },
      take: 500,
    }),
    prisma.crmLead.aggregate({
      where: { ...(where || {}), stage: "WON" },
      _sum: { valueCents: true },
      _count: true,
    }),
    prisma.crmLead.groupBy({
      by: ["source"],
      where,
      _count: { _all: true },
      _sum: { valueCents: true },
    }),
    prisma.crmLead.groupBy({
      by: ["stage"],
      where,
      _count: { _all: true },
      _sum: { valueCents: true },
    }),
    prisma.crmLead.findMany({
      where: { ...(where || {}), stage: { in: ["WON", "LOST"] } },
      select: {
        id: true,
        fullName: true,
        stage: true,
        valueCents: true,
        wonReason: true,
        lostReason: true,
        closedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.order.findMany({
      where: { status: { in: ["PAID", "COMPLETED", "PROCESSING", "PROVISIONING"] } },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            profile: { select: { city: true, province: true, country: true } },
          },
        },
        items: { select: { productName: true, totalCents: true, productId: true } },
      },
      take: 300,
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["PAID", "SENT", "OVERDUE"] } },
      select: {
        userId: true,
        totalCents: true,
        status: true,
        user: { select: { fullName: true, email: true } },
      },
      take: 300,
    }),
  ]);

  const lost = leads.filter((l) => l.stage === "LOST").length;
  const won = leads.filter((l) => l.stage === "WON").length;

  const lostReasons: Record<string, number> = {};
  const wonReasons: Record<string, number> = {};
  for (const l of closed) {
    if (l.stage === "LOST" && l.lostReason) {
      lostReasons[l.lostReason] = (lostReasons[l.lostReason] || 0) + 1;
    }
    if (l.stage === "WON" && l.wonReason) {
      wonReasons[l.wonReason] = (wonReasons[l.wonReason] || 0) + 1;
    }
  }

  // Revenue by customer
  const byCustomerMap = new Map<string, { name: string; email: string; cents: number }>();
  for (const inv of invoices) {
    const key = inv.userId;
    const cur = byCustomerMap.get(key) || {
      name: inv.user.fullName,
      email: inv.user.email,
      cents: 0,
    };
    if (inv.status === "PAID") cur.cents += inv.totalCents;
    byCustomerMap.set(key, cur);
  }
  const byCustomer = [...byCustomerMap.values()]
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 25);

  // Revenue by product (order line names)
  const byProductMap = new Map<string, { name: string; cents: number; qty: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const name = it.productName || it.productId || "Unknown";
      const cur = byProductMap.get(name) || { name, cents: 0, qty: 0 };
      cur.cents += it.totalCents;
      cur.qty += 1;
      byProductMap.set(name, cur);
    }
  }
  const byProduct = [...byProductMap.values()]
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 25);

  // Revenue by region (province/city/country)
  const byRegionMap = new Map<string, { region: string; cents: number; orders: number }>();
  for (const o of orders) {
    const region =
      o.user.profile?.province ||
      o.user.profile?.city ||
      o.user.profile?.country ||
      "Unknown";
    const cur = byRegionMap.get(region) || { region, cents: 0, orders: 0 };
    cur.cents += o.totalCents;
    cur.orders += 1;
    byRegionMap.set(region, cur);
  }
  const byRegion = [...byRegionMap.values()].sort((a, b) => b.cents - a.cents);

  const payload = {
    scope: {
      orgRole: scope.orgRole,
      isFullAccess: scope.isFullAccess,
      departmentId: scope.departmentId,
    },
    totals: {
      leads: leads.length,
      won,
      lost,
      winRate: won + lost ? Math.round((won / (won + lost)) * 100) : 0,
      wonValueCents: wonValue._sum.valueCents ?? 0,
      avgScore: leads.length
        ? Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / leads.length)
        : 0,
    },
    bySource,
    byStage,
    byCustomer,
    byProduct,
    byRegion,
    winLoss: { closed, wonReasons, lostReasons },
    reportPresets: [
      { id: "pipeline", label: "Pipeline by stage" },
      { id: "winloss", label: "Win / loss analysis" },
      { id: "revenue_customer", label: "Revenue by customer" },
      { id: "revenue_product", label: "Revenue by product" },
      { id: "revenue_region", label: "Revenue by region" },
      { id: "source", label: "Leads by source" },
    ],
  };

  // Lightweight “custom report” slice
  if (report === "revenue_customer") {
    return NextResponse.json({ ...payload, focus: "byCustomer", rows: byCustomer });
  }
  if (report === "revenue_product") {
    return NextResponse.json({ ...payload, focus: "byProduct", rows: byProduct });
  }
  if (report === "revenue_region") {
    return NextResponse.json({ ...payload, focus: "byRegion", rows: byRegion });
  }
  if (report === "winloss") {
    return NextResponse.json({ ...payload, focus: "winLoss", rows: closed });
  }
  if (report === "source") {
    return NextResponse.json({ ...payload, focus: "bySource", rows: bySource });
  }
  if (report === "pipeline") {
    return NextResponse.json({ ...payload, focus: "byStage", rows: byStage });
  }

  return NextResponse.json(payload);
}

/** Visual report designer — group/filter/metric over CRM pipeline */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const scope = await getStaffScope(auth.user);
  const baseWhere = (crmLeadScopeWhere(scope) || {}) as Record<string, unknown>;
  const body = await request.json();

  const schema = z.object({
    dimension: z.enum(["stage", "source", "wonReason", "lostReason", "priority", "owner"]),
    metric: z.enum(["count", "valueCents", "avgScore"]),
    chart: z.enum(["table", "bar", "pie"]).optional(),
    stage: z.string().optional(),
    source: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid designer payload" }, { status: 400 });
  }

  const where: Record<string, unknown> = { ...baseWhere };
  if (parsed.data.stage) where.stage = parsed.data.stage;
  if (parsed.data.source) where.source = parsed.data.source;
  if (parsed.data.from || parsed.data.to) {
    where.createdAt = {
      ...(parsed.data.from ? { gte: new Date(parsed.data.from) } : {}),
      ...(parsed.data.to ? { lte: new Date(parsed.data.to) } : {}),
    };
  }

  const leads = await prisma.crmLead.findMany({
    where,
    select: {
      stage: true,
      source: true,
      wonReason: true,
      lostReason: true,
      priority: true,
      valueCents: true,
      leadScore: true,
      owner: { select: { fullName: true } },
    },
    take: 2000,
  });

  const buckets = new Map<string, { key: string; count: number; valueCents: number; scoreSum: number }>();
  for (const l of leads) {
    let key = "—";
    switch (parsed.data.dimension) {
      case "stage":
        key = l.stage;
        break;
      case "source":
        key = l.source;
        break;
      case "wonReason":
        key = l.wonReason || "(none)";
        break;
      case "lostReason":
        key = l.lostReason || "(none)";
        break;
      case "priority":
        key = l.priority || "MEDIUM";
        break;
      case "owner":
        key = l.owner?.fullName || "Unassigned";
        break;
    }
    const cur = buckets.get(key) || { key, count: 0, valueCents: 0, scoreSum: 0 };
    cur.count += 1;
    cur.valueCents += l.valueCents;
    cur.scoreSum += l.leadScore;
    buckets.set(key, cur);
  }

  const rows = [...buckets.values()]
    .map((b) => ({
      dimension: b.key,
      count: b.count,
      valueCents: b.valueCents,
      avgScore: b.count ? Math.round(b.scoreSum / b.count) : 0,
      metric:
        parsed.data.metric === "count"
          ? b.count
          : parsed.data.metric === "valueCents"
            ? b.valueCents
            : b.count
              ? Math.round(b.scoreSum / b.count)
              : 0,
    }))
    .sort((a, b) => b.metric - a.metric);

  const max = Math.max(1, ...rows.map((r) => r.metric));

  return NextResponse.json({
    designer: parsed.data,
    rows,
    chart: {
      type: parsed.data.chart || "bar",
      max,
      bars: rows.map((r) => ({
        label: r.dimension,
        value: r.metric,
        pct: Math.round((r.metric / max) * 100),
      })),
    },
  });
}
