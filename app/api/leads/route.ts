import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { ensureLeadFromChannel } from "@/lib/crm/channels";
import {
  createDraftQuotationFromLead,
  isQuoteRequestForm,
} from "@/lib/crm/auto-quotation";
import { notifyStaffQuoteReview } from "@/lib/crm/notify-staff-quote";
import { verifyTurnstile } from "@/lib/security/turnstile";

/**
 * PUBLIC lead capture endpoint for marketing forms (Contact, Request a Quote,
 * Request a Demo, Pricing custom quote). De-dupes via ensureLeadFromChannel so
 * repeat inquiries update one CRM lead instead of creating duplicates.
 *
 * This is intentionally separate from /api/crm (staff-only pipeline management).
 */

const leadSchema = z.object({
  fullName: z.string().min(2, "Name is required").max(160),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(160).optional().or(z.literal("")),
  interest: z.string().max(200).optional().or(z.literal("")),
  message: z.string().max(5000).optional().or(z.literal("")),
  /** Where on the site the lead originated, e.g. "contact", "pricing-quote" */
  formType: z.string().max(60).optional(),
  channel: z
    .enum(["WEBSITE", "FORM", "PHONE", "EMAIL", "LIVE_CHAT"])
    .optional()
    .default("FORM"),
});

// Very small in-memory throttle (per-process). Good enough to blunt spam bursts;
// production hardening (Redis / edge) is tracked separately.
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function throttled(key: string) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.ts > WINDOW_MS) {
    hits.set(key, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anon";
    if (throttled(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid submission" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const email = d.email?.trim() || undefined;
    const phone = d.phone?.trim() || undefined;
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Please provide an email or phone number." },
        { status: 400 }
      );
    }

    // Bot protection for the public Contact form (other lead forms unaffected).
    if (d.formType === "contact") {
      const captcha = await verifyTurnstile(
        (body as { turnstileToken?: string } | null)?.turnstileToken,
        ip
      );
      if (!captcha.ok) {
        return NextResponse.json({ error: captcha.error }, { status: 400 });
      }
    }

    const user = await getSessionUser();
    const label = d.formType ? `Website form (${d.formType})` : "Website inquiry";
    const activityBody = [
      label,
      d.interest ? `Interest: ${d.interest}` : null,
      d.company ? `Company: ${d.company}` : null,
      d.message ? `\n${d.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const lead = await ensureLeadFromChannel({
      channel:
        d.channel === "LIVE_CHAT"
          ? "LIVE_CHAT"
          : d.channel === "WEBSITE"
            ? "WEBSITE"
            : "FORM",
      fullName: d.fullName,
      email: email || user?.email || null,
      phone: phone || null,
      company: d.company || user?.company || null,
      interest: d.interest || label,
      activityType: "FORM",
      activityBody,
      channelRef: d.formType ? `web:${d.formType}` : "web:form",
      userId: user?.id ?? null,
    });

    let quotationId: string | undefined;
    if (isQuoteRequestForm(d.formType) && email) {
      const quote = await createDraftQuotationFromLead({
        leadId: lead.id,
        customerName: d.fullName,
        customerEmail: email,
        company: d.company || null,
        interest: d.interest || label,
        message: d.message || null,
        userId: user?.id ?? null,
        valueCents: lead.valueCents || 0,
      });
      quotationId = quote.id;
      void notifyStaffQuoteReview({
        quoteNumber: quote.quoteNumber,
        customerName: d.fullName,
        interest: d.interest || label,
        quotationId: quote.id,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        leadNumber: lead.leadNumber,
        quotationId,
        message: quotationId
          ? "Thank you — we've received your request. Our team will review and email your quotation shortly."
          : "Thank you — our team will get back to you shortly.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[leads:post]", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
