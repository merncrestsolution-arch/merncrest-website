import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const activities = await prisma.customerActivity.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ activities });
}
