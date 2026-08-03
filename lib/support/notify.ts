import { prisma } from "@/lib/db";
import { publishPlatformSync } from "@/lib/platform/sync-events";

export async function notifyUser(opts: {
  userId: string;
  title: string;
  body: string;
  category?: string;
  href?: string;
}) {
  const row = await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      category: opts.category ?? "SYSTEM",
      href: opts.href,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: opts.userId, readAt: null },
  });

  publishPlatformSync({
    type: "notification",
    userId: opts.userId,
    id: row.id,
    title: row.title,
    unreadCount,
  });

  return row;
}
