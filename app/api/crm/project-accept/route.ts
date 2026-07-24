import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { acceptProjectToCart } from "@/lib/crm/accept-project-to-cart";

const schema = z.object({
  leadId: z.string().min(1),
  description: z.string().min(3).max(300),
  /** LKR — UI may send rupees; we accept cents */
  projectTotalCents: z.number().int().min(100),
  chargeMode: z.enum(["ADVANCE", "FULL", "CUSTOM"]),
  advancePercent: z.number().int().min(1).max(100).optional(),
  chargeCents: z.number().int().min(100).optional(),
  terms: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Sales accepts a project request and pushes Sales-decided terms to the customer cart.
 * Customer pays via Cart → Order → Invoice.
 */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input — Sales must set description, total, and charge mode." },
        { status: 400 }
      );
    }

    const result = await acceptProjectToCart({
      ...parsed.data,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
    });

    return NextResponse.json({
      ok: true,
      quoteNumber: result.quotation.quoteNumber,
      chargeCents: result.chargeCents,
      balanceCents: result.balanceCents,
      advancePercent: result.advancePercent,
      message:
        "Project accepted. Terms sent to customer cart. Customer can checkout and pay the Sales-approved amount.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    console.error("[crm:project-accept]", error);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
