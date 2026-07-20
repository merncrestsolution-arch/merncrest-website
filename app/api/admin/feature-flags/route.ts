import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ensureDefaultFlags } from "@/lib/admin/feature-flags";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await ensureDefaultFlags();
  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ flags });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    key: z.string(),
    enabled: z.boolean().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid flag" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.update({
    where: { key: parsed.data.key },
    data: {
      enabled: parsed.data.enabled,
      name: parsed.data.name,
      description: parsed.data.description,
      updatedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "ADMIN",
    entityType: "FeatureFlag",
    entityId: flag.id,
    summary: `Feature flag ${flag.key} → ${flag.enabled ? "ON" : "OFF"}`,
  });

  return NextResponse.json({ flag });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    key: z.string().min(2),
    name: z.string().min(2),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    tier: z.enum(["STABLE", "BETA", "EXPERIMENTAL"]).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid flag" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.create({
    data: {
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description,
      enabled: parsed.data.enabled ?? false,
      tier: parsed.data.tier ?? "BETA",
      updatedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "ADMIN",
    entityType: "FeatureFlag",
    entityId: flag.id,
    summary: `Feature flag created: ${flag.key}`,
  });

  return NextResponse.json({ flag }, { status: 201 });
}
