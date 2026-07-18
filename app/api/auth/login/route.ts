import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  toSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

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
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({ user: toSessionUser(user) });
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
