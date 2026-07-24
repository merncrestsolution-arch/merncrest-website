import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/commerce";
import { flushEmailOutbox } from "@/lib/notify/client-email";
import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { z } from "zod";
import { isAdminRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  if (!isAdminRole(auth.user.role)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const organizationId = await getPrimaryOrganizationId();
  const [settings, recent] = await Promise.all([
    prisma.emailNotifySetting.findMany({ where: { organizationId } }),
    prisma.emailOutbox.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  return NextResponse.json({ settings, recent });
}

const patchSchema = z.object({
  eventType: z.string(),
  enabled: z.boolean(),
  flush: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;
  if (!isAdminRole(auth.user.role)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const body = await request.json();
  if (body.flush) {
    await flushEmailOutbox();
    return NextResponse.json({ ok: true });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const organizationId = await getPrimaryOrganizationId();
  const setting = await prisma.emailNotifySetting.upsert({
    where: {
      organizationId_eventType: {
        organizationId,
        eventType: parsed.data.eventType,
      },
    },
    create: {
      organizationId,
      eventType: parsed.data.eventType,
      enabled: parsed.data.enabled,
    },
    update: { enabled: parsed.data.enabled },
  });
  return NextResponse.json({ setting });
}
