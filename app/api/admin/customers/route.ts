import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      include: {
        profile: true,
        _count: {
          select: {
            orders: true,
            invoices: true,
            domains: true,
            hostingAccounts: true,
            tickets: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        customerCode: c.profile?.customerCode,
        fullName: c.fullName,
        email: c.email,
        company: c.company,
        phone: c.profile?.phone,
        whatsapp: c.profile?.whatsapp,
        language: c.profile?.preferredLanguage,
        counts: c._count,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("[customers]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
