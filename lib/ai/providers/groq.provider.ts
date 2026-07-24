import type { AiProvider, AiResponse, ToolDefinition } from "@/lib/ai/provider.interface";

/** Groq uses OpenAI-compatible chat completions. */
function toTools(tools?: ToolDefinition[]) {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

export const groqProvider: AiProvider = {
  name: "groq",
  async chat(input) {
    const messages = [
      { role: "system", content: input.systemPrompt },
      ...input.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages,
        tools: toTools(input.tools),
        max_tokens: input.maxTokens ?? 800,
        temperature: input.temperature ?? 0.4,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    const toolCalls = (choice?.tool_calls || []).map(
      (tc: { id: string; function: { name: string; arguments: string } }) => {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || "{}");
        } catch {
          args = {};
        }
        return { id: tc.id, name: tc.function.name, arguments: args };
      }
    );

    const result: AiResponse = {
      content: choice?.content || "",
      toolCalls: toolCalls.length ? toolCalls : undefined,
      provider: "groq",
      model: input.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
    return result;
  },
};
