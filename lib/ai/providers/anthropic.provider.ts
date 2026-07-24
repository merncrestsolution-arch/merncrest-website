import type { AiProvider, AiResponse, ToolDefinition } from "@/lib/ai/provider.interface";

function toAnthropicTools(tools?: ToolDefinition[]) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

export const anthropicProvider: AiProvider = {
  name: "anthropic",
  async chat(input) {
    const messages = input.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": input.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        system: input.systemPrompt,
        messages,
        tools: toAnthropicTools(input.tools),
        max_tokens: input.maxTokens ?? 800,
        temperature: input.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const blocks: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[] =
      data.content || [];
    const content = blocks.filter((b) => b.type === "text").map((b) => b.text || "").join("\n");
    const toolCalls = blocks
      .filter((b) => b.type === "tool_use")
      .map((b) => ({
        id: b.id || crypto.randomUUID(),
        name: b.name || "",
        arguments: b.input || {},
      }));

    const result: AiResponse = {
      content,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      provider: "anthropic",
      model: input.model,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
    return result;
  },
};
