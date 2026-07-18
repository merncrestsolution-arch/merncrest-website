import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { z } from "zod";

const schema = z.object({
  domainId: z.string().min(1),
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  host: z.string().min(1),
  value: z.string().min(1),
  ttl: z.number().int().min(60).max(86400).optional(),
  priority: z.number().int().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const domain = await prisma.domain.findFirst({
      where: { id: parsed.data.domainId, userId: auth.user.id },
    });
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }
    if (domain.locked) {
      return NextResponse.json({ error: "Domain is locked" }, { status: 400 });
    }

    const record = await prisma.dnsRecord.create({
      data: {
        domainId: domain.id,
        type: parsed.data.type,
        host: parsed.data.host,
        value: parsed.data.value,
        ttl: parsed.data.ttl ?? 3600,
        priority: parsed.data.priority,
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("[dns:post]", error);
    return NextResponse.json({ error: "Failed to add DNS record" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const record = await prisma.dnsRecord.findFirst({
    where: { id, domain: { userId: auth.user.id } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.dnsRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
