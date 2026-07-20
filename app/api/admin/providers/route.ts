import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { syncProviderProducts } from "@/lib/providers/sync";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(40),
  apiUrl: z.string().url().optional().nullable(),
  apiKey: z.string().optional().nullable(),
  apiSecret: z.string().optional().nullable(),
  supportedServices: z
    .array(z.enum(["domains", "hosting", "vps", "ssl", "email", "cloud"]))
    .default(["domains", "hosting"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  defaultMarginCents: z.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
});

const patchSchema = createSchema.partial().extend({
  id: z.string().min(1),
});

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const providers = await prisma.provider.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, domains: true, hostingAccounts: true } } },
  });

  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider data", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  try {
    const provider = await prisma.provider.create({
      data: {
        name: data.name,
        code: data.code.toLowerCase().replace(/\s+/g, "-"),
        apiUrl: data.apiUrl || null,
        apiKey: data.apiKey || null,
        apiSecret: data.apiSecret || null,
        supportedServices: JSON.stringify(data.supportedServices),
        status: data.status,
        defaultMarginCents: data.defaultMarginCents,
        notes: data.notes || null,
      },
    });
    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error("[providers:post]", error);
    return NextResponse.json({ error: "Failed to create provider (code may already exist)" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, supportedServices, ...rest } = parsed.data;
  const provider = await prisma.provider.update({
    where: { id },
    data: {
      ...("name" in rest ? { name: rest.name } : {}),
      ...("code" in rest && rest.code ? { code: rest.code.toLowerCase() } : {}),
      ...("apiUrl" in rest ? { apiUrl: rest.apiUrl || null } : {}),
      ...("apiKey" in rest ? { apiKey: rest.apiKey || null } : {}),
      ...("apiSecret" in rest ? { apiSecret: rest.apiSecret || null } : {}),
      ...(supportedServices ? { supportedServices: JSON.stringify(supportedServices) } : {}),
      ...("status" in rest && rest.status ? { status: rest.status } : {}),
      ...("defaultMarginCents" in rest && rest.defaultMarginCents != null
        ? { defaultMarginCents: rest.defaultMarginCents }
        : {}),
      ...("notes" in rest ? { notes: rest.notes || null } : {}),
    },
  });

  return NextResponse.json({ provider });
}

/** Sync products from provider API */
export async function PUT(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const providerId = body.providerId as string | undefined;
  if (!providerId) {
    return NextResponse.json({ error: "providerId required" }, { status: 400 });
  }

  try {
    const result = await syncProviderProducts(providerId);
    return NextResponse.json({
      message: `Synced ${result.upserted} products`,
      ...result,
    });
  } catch (error) {
    console.error("[providers:sync]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
