import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const profile = await prisma.customerProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    return NextResponse.json({
      user: sessionUser,
      profile,
    });
  } catch (error) {
    console.error("[me]", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}
