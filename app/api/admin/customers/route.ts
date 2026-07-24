import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { createCustomerAccount } from "@/lib/commerce/create-customer";
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const tag = (searchParams.get("tag") || "").trim();
    const rating = (searchParams.get("rating") || "").trim();
    const sort = searchParams.get("sort") || "newest";
    const parentOnly = searchParams.get("parentOnly") === "1";

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        AND: [
          q
            ? {
                OR: [
                  { fullName: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { company: { contains: q, mode: "insensitive" } },
                  { profile: { customerCode: { contains: q, mode: "insensitive" } } },
                  { profile: { phone: { contains: q } } },
                ],
              }
            : {},
          rating ? { profile: { customerRating: rating } } : {},
          parentOnly ? { profile: { parentProfileId: null } } : {},
        ],
      },
      include: {
        profile: {
          include: {
            parentProfile: {
              select: {
                id: true,
                customerCode: true,
                user: { select: { fullName: true } },
              },
            },
            childProfiles: {
              select: {
                id: true,
                customerCode: true,
                user: { select: { fullName: true, email: true } },
              },
              take: 20,
            },
          },
        },
        _count: {
          select: {
            orders: true,
            invoices: true,
            domains: true,
            hostingAccounts: true,
            tickets: true,
          },
        },
      },
      orderBy:
        sort === "name"
          ? { fullName: "asc" }
          : sort === "oldest"
            ? { createdAt: "asc" }
            : { createdAt: "desc" },
      take: 200,
    });

    let rows = customers.map((c) => ({
      id: c.id,
      customerCode: c.profile?.customerCode,
      fullName: c.fullName,
      email: c.email,
      company: c.company,
      phone: c.profile?.phone,
      whatsapp: c.profile?.whatsapp,
      language: c.profile?.preferredLanguage,
      customerRating: c.profile?.customerRating,
      tagsJson: c.profile?.tagsJson,
      parentProfileId: c.profile?.parentProfileId ?? null,
      parent: c.profile?.parentProfile
        ? {
            id: c.profile.parentProfile.id,
            code: c.profile.parentProfile.customerCode,
            name: c.profile.parentProfile.user.fullName,
          }
        : null,
      children: (c.profile?.childProfiles || []).map((ch) => ({
        id: ch.id,
        code: ch.customerCode,
        name: ch.user.fullName,
        email: ch.user.email,
      })),
      counts: c._count,
      createdAt: c.createdAt,
    }));

    if (tag) {
      rows = rows.filter((r) => {
        try {
          const tags = r.tagsJson ? (JSON.parse(r.tagsJson) as string[]) : [];
          return tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()));
        } catch {
          return false;
        }
      });
    }

    return NextResponse.json({ customers: rows });
  } catch (error) {
    console.error("[customers]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const createSchema = z.object({
  fullName: z.string().min(2).max(160),
  email: z.string().email(),
  company: z.string().max(160).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  sendWelcomeEmail: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const result = await createCustomerAccount({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      company: parsed.data.company || null,
      phone: parsed.data.phone || null,
      password: parsed.data.password || null,
      sendWelcomeEmail: parsed.data.sendWelcomeEmail ?? true,
      createdById: auth.user.id,
    });

    return NextResponse.json(
      {
        customer: result.user,
        tempPassword: result.tempPassword,
        message: result.tempPassword
          ? `Client created — temporary password: ${result.tempPassword}`
          : "Client created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

const hierarchySchema = z.object({
  profileId: z.string(),
  parentProfileId: z.string().nullable(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = hierarchySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hierarchy" }, { status: 400 });
  }
  if (parsed.data.parentProfileId === parsed.data.profileId) {
    return NextResponse.json({ error: "Cannot parent self" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.update({
    where: { id: parsed.data.profileId },
    data: { parentProfileId: parsed.data.parentProfileId },
    include: {
      user: { select: { fullName: true, email: true } },
      parentProfile: { select: { id: true, customerCode: true } },
    },
  });

  return NextResponse.json({ profile });
}
