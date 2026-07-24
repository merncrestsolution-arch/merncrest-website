import { prisma } from "@/lib/db";
import { notifyWithPrefs } from "@/lib/erp/notify-center";

/** Alert sales/support staff that a new quotation needs review. */
export async function notifyStaffQuoteReview(opts: {
  quoteNumber: string;
  customerName: string;
  interest?: string | null;
  quotationId: string;
}) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
    select: { id: true },
    take: 50,
  });

  const title = `New quote request — ${opts.quoteNumber}`;
  const body = [
    opts.customerName,
    opts.interest ? `Interest: ${opts.interest}` : null,
    "Review, edit if needed, then send to the customer.",
  ]
    .filter(Boolean)
    .join(" · ");

  await Promise.all(
    staff.map((u) =>
      notifyWithPrefs({
        userId: u.id,
        title,
        body,
        category: "ORDER",
        href: `/staff/quotations?quote=${opts.quotationId}`,
      })
    )
  );
}
