import { prisma } from "@/lib/db";

export type ProviderApiCallInput = {
  orderId?: string;
  orderItemId?: string;
  providerId: string;
  operation: string;
  idempotencyKey: string;
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  httpStatus?: number;
  success: boolean;
  errorMessage?: string;
  actorId?: string;
};

/** Strip secrets from logged payloads. */
function redactPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitive = new Set([
    "password",
    "apiKey",
    "apiSecret",
    "secret",
    "token",
    "authorization",
  ]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (sensitive.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactPayload(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** Persist provider API call for reconciliation (money / provisioning). */
export async function logProviderApiCall(input: ProviderApiCallInput): Promise<void> {
  await prisma.providerApiCallLog.create({
    data: {
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      providerId: input.providerId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestJson: JSON.stringify(redactPayload(input.requestPayload)),
      responseJson: input.responsePayload
        ? JSON.stringify(redactPayload(input.responsePayload))
        : null,
      httpStatus: input.httpStatus,
      success: input.success,
      errorMessage: input.errorMessage,
      actorId: input.actorId,
    },
  });
}

/** Return cached successful response for an idempotent retry, if any. */
export async function findIdempotentProviderCall(
  idempotencyKey: string,
  operation: string
): Promise<{ success: boolean; responseJson: string | null } | null> {
  const row = await prisma.providerApiCallLog.findFirst({
    where: { idempotencyKey, operation, success: true },
    orderBy: { createdAt: "desc" },
    select: { success: true, responseJson: true },
  });
  return row;
}
