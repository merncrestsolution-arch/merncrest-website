import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/erp/permissions";
import { writeAuditLog } from "@/lib/erp/audit";
import { expireStaleOffers, featuresToJson } from "@/lib/offers";
import { offerUpsertSchema, offerUpdateSchema } from "@/lib/offers/schemas";
import { rateLimit, clientIp } from "@/lib/chat/rate-limit";
import { z } from "zod";

function sanitizeOfferInput(data: z.infer<typeof offerUpsertSchema>) {
  const features = data.featuresJson
    ? (() => {
        try {
          const arr = JSON.parse(data.featuresJson);
          return Array.isArray(arr) ? featuresToJson(arr.map(String)) : data.featuresJson;
        } catch {
          return data.featuresJson;
        }
      })()
    : data.featuresJson;

  return {
    ...data,
    featuresJson: features,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    ctaUrl: data.ctaUrl || `/offers/${data.slug}`,
  };
}

export async function GET(request: Request) {
  const auth = await requirePermission("website.offers.view");
  if (auth.error) return auth.error;

  await expireStaleOffers();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q")?.trim();

  const offers = await prisma.homepageOffer.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
              { badge: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ offers });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `offers:admin:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = await requirePermission("website.offers.manage");
  if (auth.error) return auth.error;

  const parsed = offerUpsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid offer", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = sanitizeOfferInput(parsed.data);
  const existing = await prisma.homepageOffer.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const offer = await prisma.homepageOffer.create({
    data: {
      ...data,
      createdById: auth.user.id,
      updatedById: auth.user.id,
    },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "CREATE",
    module: "WEBSITE",
    entityType: "HomepageOffer",
    entityId: offer.id,
    summary: `Homepage offer created: ${offer.slug}`,
  });

  return NextResponse.json({ offer }, { status: 201 });
}

export async function PATCH(request: Request) {
  const ip = clientIp(request);
  const rl = rateLimit({ key: `offers:admin:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = await requirePermission("website.offers.manage");
  if (auth.error) return auth.error;

  const parsed = offerUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id, ...rest } = parsed.data;
  const existing = await prisma.homepageOffer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (rest.slug && rest.slug !== existing.slug) {
    const clash = await prisma.homepageOffer.findUnique({ where: { slug: rest.slug } });
    if (clash) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const updateData: Record<string, unknown> = { ...rest, updatedById: auth.user.id };

  if (rest.featuresJson !== undefined) {
    try {
      const arr = JSON.parse(rest.featuresJson);
      updateData.featuresJson = Array.isArray(arr) ? featuresToJson(arr.map(String)) : rest.featuresJson;
    } catch {
      updateData.featuresJson = rest.featuresJson;
    }
  }
  if (rest.startDate !== undefined) {
    updateData.startDate = rest.startDate ? new Date(rest.startDate) : null;
  }
  if (rest.endDate !== undefined) {
    updateData.endDate = rest.endDate ? new Date(rest.endDate) : null;
  }
  if (rest.ctaUrl !== undefined && !rest.ctaUrl && rest.slug) {
    updateData.ctaUrl = `/offers/${rest.slug}`;
  }

  const offer = await prisma.homepageOffer.update({
    where: { id },
    data: updateData,
  });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "UPDATE",
    module: "WEBSITE",
    entityType: "HomepageOffer",
    entityId: offer.id,
    summary: `Homepage offer updated: ${offer.slug}`,
  });

  return NextResponse.json({ offer });
}

export async function DELETE(request: Request) {
  const auth = await requirePermission("website.offers.manage");
  if (auth.error) return auth.error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.homepageOffer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.homepageOffer.delete({ where: { id } });

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "DELETE",
    module: "WEBSITE",
    entityType: "HomepageOffer",
    entityId: id,
    summary: `Homepage offer deleted: ${existing.slug}`,
  });

  return NextResponse.json({ ok: true });
}
