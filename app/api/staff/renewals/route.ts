import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/commerce";
import { staffInitiateRenewal } from "@/lib/commerce/staff-renewal";
import { identifyCustomerFromSession } from "@/lib/chat/identify-customer";

const schema = z.object({
  type: z.enum(["domain", "hosting", "ssl"]),
  serviceId: z.string().min(1),
  customerUserId: z.string().optional(),
  sessionId: z.string().optional(),
});

/** Staff one-click renewal — adds item to customer cart + posts checkout link in chat */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid renewal request" }, { status: 400 });
  }

  try {
    let customerUserId = parsed.data.customerUserId;

    if (!customerUserId && parsed.data.sessionId) {
      const identified = await identifyCustomerFromSession(parsed.data.sessionId);
      customerUserId = identified.userId || undefined;
    }

    if (!customerUserId) {
      return NextResponse.json(
        { error: "Customer not identified — capture email/phone or link account first" },
        { status: 400 }
      );
    }

    const result = await staffInitiateRenewal({
      customerUserId,
      type: parsed.data.type,
      serviceId: parsed.data.serviceId,
      staffUserId: auth.user.id,
      staffName: auth.user.fullName,
      sessionId: parsed.data.sessionId,
    });

    return NextResponse.json({ renewal: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Renewal failed" },
      { status: 400 }
    );
  }
}
