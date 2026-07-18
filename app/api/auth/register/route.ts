import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSession,
  generateToken,
  hashPassword,
  setSessionCookie,
  toSessionUser,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, email, company, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const emailVerifyToken = generateToken();
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        company: company?.trim() || null,
        passwordHash,
        emailVerifyToken,
        role: "CUSTOMER",
        profile: { create: {} },
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${emailVerifyToken}`;
    await sendVerificationEmail(user.email, verifyUrl);

    const ua = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const { token, expiresAt } = await createSession(user.id, { userAgent: ua, ip });
    await setSessionCookie(token, expiresAt);

    return NextResponse.json(
      {
        user: toSessionUser(user),
        message: "Account created. Check your email to verify.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
