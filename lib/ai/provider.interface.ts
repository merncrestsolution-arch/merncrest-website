export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
  toolCallId?: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AiResponse = {
  content: string;
  toolCalls?: ToolCall[];
  provider: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export interface AiProvider {
  name: string;
  chat(input: {
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    systemPrompt: string;
    tools?: ToolDefinition[];
    maxTokens?: number;
    temperature?: number;
  }): Promise<AiResponse>;
}
