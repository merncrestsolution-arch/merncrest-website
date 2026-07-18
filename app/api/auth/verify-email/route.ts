import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/en/login?error=missing_token", request.url));
    }

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/en/login?error=invalid_token", request.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerifyToken: null,
      },
    });

    const redirectTo =
      user.role === "ADMIN" || user.role === "OWNER" || user.role === "STAFF"
        ? "/en/admin?verified=1"
        : "/en/portal?verified=1";

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.redirect(new URL("/en/login?error=verify_failed", request.url));
  }
}
