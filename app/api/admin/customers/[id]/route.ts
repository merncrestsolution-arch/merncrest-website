import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

/** Full customer 360 profile */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { profile: { customerCode: id } }],
      role: "CUSTOMER",
    },
    include: {
      profile: true,
      domains: { orderBy: { createdAt: "desc" } },
      hostingAccounts: { orderBy: { createdAt: "desc" } },
      subscriptions: true,
      orders: { include: { items: true, invoice: true }, orderBy: { createdAt: "desc" }, take: 20 },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
      payments: { orderBy: { createdAt: "desc" }, take: 20 },
      tickets: { include: { messages: { take: 3, orderBy: { createdAt: "desc" } } }, take: 20 },
      chatSessions: { include: { messages: { take: 5, orderBy: { createdAt: "desc" } } }, take: 10 },
      callbackRequests: { take: 10, orderBy: { createdAt: "desc" } },
      callRecords: { take: 10, orderBy: { createdAt: "desc" } },
      quotations: { include: { items: true }, take: 10, orderBy: { createdAt: "desc" } },
      notifications: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const openInvoices = user.invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID");
  const paidInvoices = user.invoices.filter((i) => i.status === "PAID");

  return NextResponse.json({
    customer: {
      id: user.id,
      customerCode: user.profile?.customerCode,
      fullName: user.fullName,
      company: user.company,
      email: user.email,
      profile: user.profile,
      services: {
        domains: user.domains,
        hosting: user.hostingAccounts,
        subscriptions: user.subscriptions,
      },
      financial: {
        openInvoices,
        paidInvoices,
        creditBalanceCents: user.profile?.creditBalanceCents ?? 0,
        payments: user.payments,
        orders: user.orders,
        quotations: user.quotations,
      },
      support: {
        tickets: user.tickets,
        chats: user.chatSessions,
        callbacks: user.callbackRequests,
        calls: user.callRecords,
      },
      notifications: user.notifications,
    },
  });
}
