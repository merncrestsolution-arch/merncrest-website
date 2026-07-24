import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";

/** Inbound routing rules + gateway config for System comms */
export async function GET() {
  const auth = await requirePermission(["erp.analytics.view", "erp.permissions.manage"]);
  if (auth.error) return auth.error;

  const [rules, gateways] = await Promise.all([
    prisma.routingRule.findMany({ orderBy: { priority: "asc" }, take: 50 }),
    prisma.systemGatewayConfig.findMany(),
  ]);
  return NextResponse.json({ rules, gateways });
}

const ruleSchema = z.object({
  name: z.string().min(2),
  source: z.enum(["WHATSAPP", "EMAIL", "IVR", "FORM", "PORTAL", "TICKET"]),
  targetType: z.enum(["LEAD", "TICKET"]).optional(),
  department: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.number().int().optional(),
  matchJson: z.string().optional(),
  active: z.boolean().optional(),
});

const gatewaySchema = z.object({
  provider: z.enum(["WHATSAPP", "IVR", "SMS", "EMAIL"]),
  configJson: z.string().optional(),
  active: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requirePermission("erp.permissions.manage");
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.provider) {
    const parsed = gatewaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid gateway" }, { status: 400 });
    }
    const gateway = await prisma.systemGatewayConfig.upsert({
      where: { provider: parsed.data.provider },
      update: {
        configJson: parsed.data.configJson,
        active: parsed.data.active ?? false,
      },
      create: {
        provider: parsed.data.provider,
        configJson: parsed.data.configJson,
        active: parsed.data.active ?? false,
      },
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "SETTINGS",
      module: "SYSTEM",
      entityType: "SystemGatewayConfig",
      entityId: gateway.id,
      summary: `Gateway ${gateway.provider} updated`,
    });
    return NextResponse.json({ gateway });
  }

  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rule" }, { status: 400 });
  }

  const rule = await prisma.routingRule.create({
    data: {
      ...parsed.data,
      targetType: parsed.data.targetType || "TICKET",
      priority: parsed.data.priority ?? 100,
      active: parsed.data.active ?? true,
      createdById: auth.user.id,
    },
  });
  return NextResponse.json({ rule }, { status: 201 });
}
