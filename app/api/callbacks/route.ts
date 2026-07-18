import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { requireStaff } from "@/lib/commerce";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";

const createSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  reason: z.enum(["SALES", "SUPPORT", "BILLING", "TECHNICAL"]).optional(),
  preferredAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/** Public + authenticated callback requests (IVR / phone care) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid callback request" }, { status: 400 });
    }

    const user = await getSessionUser();
    const cb = await prisma.callbackRequest.create({
      data: {
        userId: user?.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email || user?.email,
        reason: parsed.data.reason ?? "SUPPORT",
        preferredAt: parsed.data.preferredAt,
        notes: parsed.data.notes,
        status: "PENDING",
      },
    });

    if (user) {
      await notifyUser({
        userId: user.id,
        title: "Callback requested",
        body: `We will call ${parsed.data.phone} soon.`,
        category: "SUPPORT",
        href: "/support",
      });
    }

    // Mirror into CRM as a lead activity source
    await prisma.crmLead.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email || user?.email || `${parsed.data.phone}@callback.local`,
        phone: parsed.data.phone,
        interest: `Callback · ${parsed.data.reason ?? "SUPPORT"}`,
        source: "IVR_CALLBACK",
        stage: "NEW",
        notes: parsed.data.notes,
        activities: {
          create: {
            type: "CALL",
            body: `Callback requested${parsed.data.preferredAt ? ` at ${parsed.data.preferredAt}` : ""}`,
          },
        },
      },
    });

    return NextResponse.json(
      { callback: cb, message: "Callback queued — customer care will contact you." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[callbacks:post]", error);
    return NextResponse.json({ error: "Failed to request callback" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const callbacks = await prisma.callbackRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ callbacks });
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const callback = await prisma.callbackRequest.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ callback });
}
