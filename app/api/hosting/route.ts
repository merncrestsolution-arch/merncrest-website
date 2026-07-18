import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const accounts = await prisma.hostingAccount.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
    });
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: auth.user.id },
      orderBy: { nextBillingAt: "asc" },
    });
    return NextResponse.json({ accounts, subscriptions });
  } catch (error) {
    console.error("[hosting:get]", error);
    return NextResponse.json({ error: "Failed to load hosting" }, { status: 500 });
  }
}
