import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSession,
  isStaffRole,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import type { Role } from "@/lib/auth-types";
import { loginSchema } from "@/lib/validations/auth";
import { isAccountLocked, clearLoginFailures } from "@/lib/security/auth-policy";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { z } from "zod";

const mobileLoginSchema = loginSchema.extend({
  turnstileToken: z.string().optional(),
  deviceName: z.string().max(120).optional(),
  platform: z.enum(["ios", "android", "flutter", "web"]).optional(),
});

/** MernCrest Connect — mobile staff login (Bearer token, no Turnstile). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = mobileLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const ua = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const deviceLabel = parsed.data.deviceName || parsed.data.platform || "MernCrest Connect";

    const lock = await isAccountLocked(email);
    if (lock.locked) {
      return NextResponse.json(
        { error: "Account temporarily locked. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const captcha =
      request.headers.get("x-merncrest-client") === "connect-mobile"
        ? { ok: true as const }
        : await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await prisma.loginHistory
        .create({
          data: {
            userId: user?.id ?? null,
            email,
            success: false,
            ip,
            userAgent: `${deviceLabel} · ${ua ?? "mobile"}`,
          },
        })
        .catch(() => undefined);

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!isStaffRole(user.role as Role)) {
      return NextResponse.json(
        { error: "Staff account required. Use your MernCrest work email." },
        { status: 403 }
      );
    }

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email,
        success: true,
        ip,
        userAgent: `${deviceLabel} · ${ua ?? "mobile"}`,
      },
    });

    await clearLoginFailures(email);

    const { token, expiresAt } = await createSession(user.id, {
      userAgent: `${deviceLabel} · ${ua ?? "mobile"}`,
      ip,
    });

    return NextResponse.json({
      accessToken: token,
      expiresAt: expiresAt.toISOString(),
      tokenType: "Bearer",
      user: toSessionUser(user),
    });
  } catch (error) {
    console.error("[mobile/login]", error);
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
