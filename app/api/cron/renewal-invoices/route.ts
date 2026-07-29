import { apiError, apiSuccess } from "@/lib/api/envelope";
import { processRenewalInvoices } from "@/lib/billing/renewal-invoices";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return apiError("CONFIG", "CRON_SECRET is not configured", 500);
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-cron-secret");
  const provided = bearer || headerSecret;

  if (!provided || provided !== secret) {
    return apiError("UNAUTHORIZED", "Invalid cron secret", 401);
  }

  const result = await processRenewalInvoices();
  return apiSuccess(result);
}
