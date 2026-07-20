import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const [apiKeys, webhooks, templates] = await Promise.all([
    prisma.platformApiKey.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        status: true,
        scopesJson: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.webhookEndpoint.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.emailTemplate.findMany({ orderBy: { key: "asc" }, take: 50 }),
  ]);

  return NextResponse.json({ apiKeys, webhooks, templates });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "apiKey") {
    const schema = z.object({
      name: z.string().min(2),
      scopes: z.array(z.string()).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
    }
    const raw = `mc_${randomBytes(24).toString("hex")}`;
    const key = await prisma.platformApiKey.create({
      data: {
        name: parsed.data.name,
        keyPrefix: raw.slice(0, 10),
        keyHash: hashKey(raw),
        scopesJson: JSON.stringify(parsed.data.scopes ?? ["read"]),
        status: "ACTIVE",
        createdById: auth.user.id,
      },
    });

    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "API",
      entityType: "PlatformApiKey",
      entityId: key.id,
      summary: `API key created: ${key.name}`,
    });

    return NextResponse.json(
      { apiKey: { ...key, secretOnce: raw } },
      { status: 201 }
    );
  }

  if (body.action === "webhook") {
    const schema = z.object({
      name: z.string().min(2),
      url: z.string().url(),
      eventTypes: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
    }
    const wh = await prisma.webhookEndpoint.create({
      data: {
        name: parsed.data.name,
        url: parsed.data.url,
        eventTypes: parsed.data.eventTypes ?? "ALL",
        secret: randomBytes(16).toString("hex"),
        active: true,
      },
    });

    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "API",
      entityType: "WebhookEndpoint",
      entityId: wh.id,
      summary: `Webhook created: ${wh.name}`,
    });

    return NextResponse.json({ webhook: wh }, { status: 201 });
  }

  if (body.action === "emailTemplate") {
    const schema = z.object({
      key: z.string().min(2),
      name: z.string().min(2),
      subject: z.string().min(2),
      bodyHtml: z.string().min(2),
      bodyText: z.string().optional(),
      locale: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    }
    const tpl = await prisma.emailTemplate.upsert({
      where: { key: parsed.data.key },
      update: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        bodyHtml: parsed.data.bodyHtml,
        bodyText: parsed.data.bodyText,
        locale: parsed.data.locale ?? "en",
        updatedById: auth.user.id,
      },
      create: {
        key: parsed.data.key,
        name: parsed.data.name,
        subject: parsed.data.subject,
        bodyHtml: parsed.data.bodyHtml,
        bodyText: parsed.data.bodyText,
        locale: parsed.data.locale ?? "en",
        updatedById: auth.user.id,
      },
    });
    return NextResponse.json({ template: tpl }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "revokeKey" && body.id) {
    const key = await prisma.platformApiKey.update({
      where: { id: body.id },
      data: { status: "REVOKED" },
    });
    await writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "API",
      entityType: "PlatformApiKey",
      entityId: key.id,
      summary: `API key revoked: ${key.name}`,
    });
    return NextResponse.json({ apiKey: key });
  }

  if (body.action === "toggleWebhook" && body.id != null) {
    const wh = await prisma.webhookEndpoint.update({
      where: { id: body.id },
      data: { active: Boolean(body.active) },
    });
    return NextResponse.json({ webhook: wh });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
