import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { encryptAiSecret, maskApiKey } from "@/lib/ai/crypto";
import { testAiProviderConnection } from "@/lib/ai/ai-router";
import { writeAuditLog } from "@/lib/erp/audit";
import { buildAiraSystemPrompt, defaultChatFallback } from "@/lib/support/chat-knowledge";

function requireAdminStaff() {
  return requireStaff().then(async (auth) => {
    if (auth.error) return auth;
    if (!isAdminRole(auth.user.role)) {
      return {
        error: NextResponse.json({ error: "Admin only" }, { status: 403 }),
      } as const;
    }
    return auth;
  });
}

export async function GET() {
  const auth = await requireAdminStaff();
  if ("error" in auth && auth.error) return auth.error;

  const organizationId = await getPrimaryOrganizationId();
  const [providers, assistant, logs] = await Promise.all([
    prisma.aiProviderConfig.findMany({
      where: { organizationId },
      orderBy: { priority: "asc" },
    }),
    prisma.aiAssistantConfig.findUnique({ where: { organizationId } }),
    prisma.aiCallLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    providers: providers.map((p) => ({
      id: p.id,
      provider: p.provider,
      label: p.label,
      model: p.model,
      isActive: p.isActive,
      priority: p.priority,
      apiKeyMasked: maskApiKey(p.apiKeyEncrypted),
      updatedAt: p.updatedAt,
    })),
    assistant: assistant || {
      displayName: "Aira",
      avatarUrl: null,
      systemPrompt: buildAiraSystemPrompt(),
      fallbackMessage: defaultChatFallback(),
    },
    logs,
  });
}

const providerSchema = z.object({
  id: z.string().optional(),
  provider: z.enum(["openai", "anthropic", "groq"]),
  label: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  apiKey: z.string().min(8).max(500).optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  delete: z.boolean().optional(),
  test: z.boolean().optional(),
});

const assistantSchema = z.object({
  displayName: z.string().min(1).max(120),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  systemPrompt: z.string().min(20).max(8000),
  fallbackMessage: z.string().min(5).max(500),
});

export async function POST(request: Request) {
  const auth = await requireAdminStaff();
  if ("error" in auth && auth.error) return auth.error;
  const user = "user" in auth ? auth.user : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const organizationId = await getPrimaryOrganizationId();

  if (body.action === "assistant") {
    const parsed = assistantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid assistant config" }, { status: 400 });
    }
    const assistant = await prisma.aiAssistantConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        displayName: parsed.data.displayName,
        avatarUrl: parsed.data.avatarUrl || null,
        systemPrompt: parsed.data.systemPrompt,
        fallbackMessage: parsed.data.fallbackMessage,
      },
      update: {
        displayName: parsed.data.displayName,
        avatarUrl: parsed.data.avatarUrl || null,
        systemPrompt: parsed.data.systemPrompt,
        fallbackMessage: parsed.data.fallbackMessage,
      },
    });
    await writeAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.fullName,
      action: "UPDATE",
      module: "AI",
      entityType: "AiAssistantConfig",
      entityId: assistant.id,
      summary: "Updated AI assistant persona",
    }).catch(() => undefined);
    return NextResponse.json({ assistant });
  }

  const parsed = providerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  if (parsed.data.test && parsed.data.id) {
    const result = await testAiProviderConnection(parsed.data.id);
    return NextResponse.json(result);
  }

  if (parsed.data.delete && parsed.data.id) {
    await prisma.aiProviderConfig.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.id) {
    const data: {
      label: string;
      model: string;
      provider: string;
      isActive?: boolean;
      priority?: number;
      apiKeyEncrypted?: string;
    } = {
      label: parsed.data.label,
      model: parsed.data.model,
      provider: parsed.data.provider,
      isActive: parsed.data.isActive,
      priority: parsed.data.priority,
    };
    if (parsed.data.apiKey) {
      data.apiKeyEncrypted = encryptAiSecret(parsed.data.apiKey);
    }
    const updated = await prisma.aiProviderConfig.update({
      where: { id: parsed.data.id },
      data,
    });
    return NextResponse.json({
      provider: { ...updated, apiKeyMasked: maskApiKey(updated.apiKeyEncrypted), apiKeyEncrypted: undefined },
    });
  }

  if (!parsed.data.apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 400 });
  }

  const created = await prisma.aiProviderConfig.create({
    data: {
      organizationId,
      provider: parsed.data.provider,
      label: parsed.data.label,
      model: parsed.data.model,
      apiKeyEncrypted: encryptAiSecret(parsed.data.apiKey),
      isActive: parsed.data.isActive ?? true,
      priority: parsed.data.priority ?? 0,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorName: user.fullName,
    action: "CREATE",
    module: "AI",
    entityType: "AiProviderConfig",
    entityId: created.id,
    summary: `Added AI provider ${created.provider}`,
  }).catch(() => undefined);

  return NextResponse.json({
    provider: {
      id: created.id,
      provider: created.provider,
      label: created.label,
      model: created.model,
      isActive: created.isActive,
      priority: created.priority,
      apiKeyMasked: maskApiKey(created.apiKeyEncrypted),
    },
  });
}
