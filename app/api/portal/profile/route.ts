import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";
import { logCustomerActivity } from "@/lib/crm/customer-hooks";
import { encryptPii, decryptPii } from "@/lib/security/pii";
import { z } from "zod";

function decryptProfile<T extends { nicPassport?: string | null; businessReg?: string | null }>(
  profile: T | null
) {
  if (!profile) return profile;
  return {
    ...profile,
    nicPassport: decryptPii(profile.nicPassport),
    businessReg: decryptPii(profile.businessReg),
  };
}

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    include: { profile: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const loginHistory = await prisma.loginHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      company: user.company,
      emailVerifiedAt: user.emailVerifiedAt,
      role: user.role,
      createdAt: user.createdAt,
    },
    // Customer may read own PII (decrypted). Encrypted at rest in DB.
    profile: decryptProfile(user.profile),
    loginHistory,
  });
}

const patchSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  company: z.string().max(160).optional().nullable(),
  photoUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  province: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  businessReg: z.string().max(80).optional().nullable(),
  nicPassport: z.string().max(80).optional().nullable(),
  timezone: z.string().max(60).optional().nullable(),
  preferredLanguage: z.enum(["en", "si", "ta"]).optional(),
  notifyEmail: z.boolean().optional(),
  notifyWhatsApp: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const userUpdate: { fullName?: string; company?: string | null } = {};
  if (data.fullName) userUpdate.fullName = data.fullName.trim();
  if ("company" in data) userUpdate.company = data.company?.trim() || null;

  if (Object.keys(userUpdate).length) {
    await prisma.user.update({
      where: { id: auth.user.id },
      data: userUpdate,
    });
  }

  const profileData: Record<string, unknown> = {};
  const profileKeys = [
    "photoUrl",
    "phone",
    "whatsapp",
    "address",
    "city",
    "province",
    "postalCode",
    "country",
    "timezone",
    "preferredLanguage",
    "notifyEmail",
    "notifyWhatsApp",
    "notifySms",
    "marketingOptIn",
  ] as const;

  for (const key of profileKeys) {
    if (key in data) {
      const val = data[key];
      profileData[key] = val === "" ? null : val;
    }
  }

  // Encrypt PII at rest (PDPA)
  if ("businessReg" in data) {
    profileData.businessReg = encryptPii(
      data.businessReg === "" ? null : data.businessReg
    );
  }
  if ("nicPassport" in data) {
    profileData.nicPassport = encryptPii(
      data.nicPassport === "" ? null : data.nicPassport
    );
  }

  const profile = await prisma.customerProfile.upsert({
    where: { userId: auth.user.id },
    create: {
      userId: auth.user.id,
      customerCode: `MC-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      ...profileData,
    },
    update: profileData,
  });

  await logCustomerActivity({
    userId: auth.user.id,
    category: "PROFILE",
    title: "Profile updated",
    body: "Account settings saved",
    href: "/portal/settings",
  });

  return NextResponse.json({
    profile: decryptProfile(profile),
    message: "Profile saved",
  });
}
