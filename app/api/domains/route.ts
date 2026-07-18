import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { z } from "zod";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const domains = await prisma.domain.findMany({
      where: { userId: auth.user.id },
      include: { dnsRecords: { orderBy: { type: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ domains });
  } catch (error) {
    console.error("[domains:get]", error);
    return NextResponse.json({ error: "Failed to load domains" }, { status: 500 });
  }
}

const patchSchema = z.object({
  domainId: z.string().min(1),
  autoRenew: z.boolean().optional(),
  locked: z.boolean().optional(),
  nameservers: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const domain = await prisma.domain.findFirst({
      where: { id: parsed.data.domainId, userId: auth.user.id },
    });
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const updated = await prisma.domain.update({
      where: { id: domain.id },
      data: {
        autoRenew: parsed.data.autoRenew ?? domain.autoRenew,
        locked: parsed.data.locked ?? domain.locked,
        nameservers: parsed.data.nameservers ?? domain.nameservers,
        status: parsed.data.locked ? "LOCKED" : domain.status === "LOCKED" ? "ACTIVE" : domain.status,
      },
      include: { dnsRecords: true },
    });

    return NextResponse.json({ domain: updated });
  } catch (error) {
    console.error("[domains:patch]", error);
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
  }
}
