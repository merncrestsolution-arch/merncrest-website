import { prisma } from "@/lib/db";

export async function notifyUser(opts: {
  userId: string;
  title: string;
  body: string;
  category?: string;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      category: opts.category ?? "SYSTEM",
      href: opts.href,
    },
  });
}
