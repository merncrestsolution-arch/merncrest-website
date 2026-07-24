import { prisma } from "@/lib/db";
import { decryptAiSecret } from "@/lib/ai/crypto";
import type { AiProvider, AiResponse, ChatMessage, ToolDefinition } from "@/lib/ai/provider.interface";
import { openaiProvider } from "@/lib/ai/providers/openai.provider";
import { anthropicProvider } from "@/lib/ai/providers/anthropic.provider";
import { groqProvider } from "@/lib/ai/providers/groq.provider";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

const REGISTRY: Record<string, AiProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  groq: groqProvider,
};

/** Skip demo/placeholder keys so we fall through to FAQ replies quickly. */
function looksLikePlaceholderKey(key: string): boolean {
  const k = key.trim().toLowerCase();
  if (!k || k.length < 20) return true;
  if (k.includes("abcde") || k.includes("your-") || k.includes("change-me")) return true;
  if (k.endsWith("ef12") && k.startsWith("sk-abcde")) return true;
  return false;
}

/** Register additional providers without touching router call sites. */
export function registerAiProvider(name: string, provider: AiProvider) {
  REGISTRY[name] = provider;
}

export async function routeAiChat(opts: {
  organizationId?: string;
  messages: ChatMessage[];
  systemPrompt: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
  sessionId?: string;
}): Promise<AiResponse & { fallbackUsed: boolean }> {
  const organizationId = opts.organizationId ?? (await getPrimaryOrganizationId());
  const dbConfigs = await prisma.aiProviderConfig.findMany({
    where: { organizationId, isActive: true },
    orderBy: { priority: "asc" },
  });
  const configs = [...dbConfigs];

  // Env fallback / override (OPENAI_API_KEY / GROQ_API_KEY in .env.production)
  const envOpenAi = process.env.OPENAI_API_KEY?.trim();
  if (envOpenAi && !looksLikePlaceholderKey(envOpenAi)) {
    configs.unshift({
      id: "env-openai",
      organizationId,
      provider: "openai",
      label: "OpenAI (env)",
      apiKeyEncrypted: envOpenAi,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o",
      isActive: true,
      priority: -1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const envGroq = process.env.GROQ_API_KEY?.trim();
  if (envGroq && !looksLikePlaceholderKey(envGroq)) {
    configs.push({
      id: "env-groq",
      organizationId,
      provider: "groq",
      label: "Groq (env)",
      apiKeyEncrypted: envGroq,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      isActive: true,
      priority: 99,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Drop known placeholder / empty keys so we fail over to FAQ quickly
  const usable = configs.filter((cfg) => {
    const key =
      cfg.id === "env-openai" || cfg.id === "env-groq"
        ? cfg.apiKeyEncrypted
        : decryptAiSecret(cfg.apiKeyEncrypted);
    return Boolean(key && !looksLikePlaceholderKey(key));
  });
  configs.length = 0;
  configs.push(...usable);

  if (!configs.length) {
    // No usable LLM keys — let orchestrator fall through to FAQ/Aira replies
    return {
      content: "",
      provider: "none",
      model: "faq",
      toolCalls: [],
      fallbackUsed: true,
    };
  }

  const maxTokens =
    opts.maxTokens ??
    (Number(process.env.OPENAI_MAX_TOKENS || 1500) || 1500);

  let fallbackUsed = false;
  let lastError: Error | null = null;

  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const provider = REGISTRY[cfg.provider];
    if (!provider) {
      lastError = new Error(`Unknown provider: ${cfg.provider}`);
      continue;
    }
    const apiKey =
      cfg.id === "env-openai" || cfg.id === "env-groq"
        ? cfg.apiKeyEncrypted
        : decryptAiSecret(cfg.apiKeyEncrypted);
    if (!apiKey || looksLikePlaceholderKey(apiKey)) {
      lastError = new Error(`Missing key for ${cfg.provider}`);
      continue;
    }

    const started = Date.now();
    try {
      const result = await provider.chat({
        apiKey,
        model: cfg.model,
        messages: opts.messages,
        systemPrompt: opts.systemPrompt,
        tools: opts.tools,
        maxTokens,
      });
      const latencyMs = Date.now() - started;
      await prisma.aiCallLog.create({
        data: {
          organizationId,
          provider: cfg.provider,
          model: cfg.model,
          latencyMs,
          success: true,
          fallbackUsed: i > 0,
          sessionId: opts.sessionId || null,
        },
      });
      return { ...result, fallbackUsed: i > 0 || fallbackUsed };
    } catch (error) {
      fallbackUsed = true;
      lastError = error instanceof Error ? error : new Error(String(error));
      await prisma.aiCallLog.create({
        data: {
          organizationId,
          provider: cfg.provider,
          model: cfg.model,
          latencyMs: Date.now() - started,
          success: false,
          fallbackUsed: true,
          errorMessage: lastError.message.slice(0, 500),
          sessionId: opts.sessionId || null,
        },
      });
    }
  }

  throw lastError || new Error("All AI providers failed");
}

export async function testAiProviderConnection(configId: string): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  model?: string;
}> {
  const cfg = await prisma.aiProviderConfig.findUnique({ where: { id: configId } });
  if (!cfg) return { ok: false, latencyMs: 0, error: "Not found" };
  const provider = REGISTRY[cfg.provider];
  if (!provider) return { ok: false, latencyMs: 0, error: "Unknown provider" };
  const apiKey = decryptAiSecret(cfg.apiKeyEncrypted);
  if (!apiKey) return { ok: false, latencyMs: 0, error: "Invalid key" };

  const started = Date.now();
  try {
    await provider.chat({
      apiKey,
      model: cfg.model,
      systemPrompt: "Reply with exactly: ok",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 16,
    });
    return { ok: true, latencyMs: Date.now() - started, model: cfg.model };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
