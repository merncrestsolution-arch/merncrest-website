import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/commerce";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: auth.user.id },
      include: { order: { select: { orderNumber: true, status: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("[invoices:get]", error);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
