import type { ToolDefinition } from "@/lib/ai/provider.interface";

export const CHAT_TOOLS: ToolDefinition[] = [
  {
    name: "capture_lead_info",
    description:
      "Save visitor contact details only when they voluntarily share them (name, email, phone, company, requirement).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        requirement: { type: "string" },
      },
    },
  },
  {
    name: "flag_qualified_lead",
    description: "Mark the lead as sales-qualified when budget/timeline/need are clear.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
        urgency: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
      },
      required: ["reason"],
    },
  },
  {
    name: "request_human_handoff",
    description: "Request a human agent when the visitor asks, or when the question needs human judgment.",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

function str(v: unknown, max = 500): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
}

export function sanitizeLeadCapture(args: Record<string, unknown>) {
  return {
    name: str(args.name, 120),
    email: str(args.email, 200)?.toLowerCase(),
    phone: str(args.phone, 40),
    company: str(args.company, 160),
    requirement: str(args.requirement, 1000),
  };
}

export function sanitizeHandoff(args: Record<string, unknown>) {
  return { reason: str(args.reason, 300) || "Visitor requested human" };
}

export function sanitizeQualified(args: Record<string, unknown>) {
  const urgency = str(args.urgency, 20)?.toUpperCase();
  const allowed = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  return {
    reason: str(args.reason, 500) || "Qualified by AI",
    urgency: urgency && allowed.includes(urgency) ? urgency : "MEDIUM",
  };
}
