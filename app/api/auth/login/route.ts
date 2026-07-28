import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { isAccountLocked } from "@/lib/security/auth-policy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const ua = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const lock = await isAccountLocked(email);
    if (lock.locked) {
      return NextResponse.json(
        { error: "Account temporarily locked due to failed login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const captcha = await verifyTurnstile(
      (body as { turnstileToken?: string })?.turnstileToken,
      ip
    );
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await prisma.loginHistory.create({
        data: {
          userId: user?.id ?? null,
          email,
          success: false,
          ip,
          userAgent: ua,
        },
      }).catch(() => undefined);

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email,
        success: true,
        ip,
        userAgent: ua,
      },
    });

    const { token, expiresAt } = await createSession(user.id, { userAgent: ua, ip });
    await setSessionCookie(token, expiresAt, request);

    return NextResponse.json({ user: toSessionUser(user) });
  } catch (error) {
    console.error("[login]", error);
    const msg =
      error instanceof Error &&
      (error.message.includes("Can't reach database") ||
        error.message.includes("ECONNREFUSED") ||
        error.name === "PrismaClientInitializationError")
        ? "Database is offline. Start Docker Desktop, then run: npm run db:up"
        : "Login failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
