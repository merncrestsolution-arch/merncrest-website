import { prisma } from "@/lib/db";
import { isStaffRole, type SessionUser } from "@/lib/auth";

export type PlatformSyncPayload = {
  serverTime: string;
  since: string | null;
  unreadNotifications: number;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    category: string;
    href: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
  liveChats: number;
  openTasks: number;
  openTickets: number;
  modules: string[];
};

export async function buildPlatformSyncPayload(
  user: SessionUser,
  since: Date | null
): Promise<PlatformSyncPayload> {
  const sinceFilter = since ? { gt: since } : undefined;
  const staff = isStaffRole(user.role);

  const [notifications, unreadNotifications, openTasks, openTickets, liveChats] =
    await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: user.id,
          ...(sinceFilter ? { createdAt: sinceFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          title: true,
          body: true,
          category: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
      staff
        ? prisma.projectTask.count({
            where: { assigneeId: user.id, status: { not: "DONE" } },
          })
        : Promise.resolve(0),
      staff
        ? prisma.ticket.count({
            where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
          })
        : Promise.resolve(0),
      staff
        ? prisma.chatSession.count({
            where: { status: { in: ["OPEN", "HANDOFF", "PENDING"] } },
          })
        : Promise.resolve(0),
    ]);

  const modules = ["notifications"];
  if (staff) modules.push("tasks", "tickets", "chat", "announcements", "crm");

  return {
    serverTime: new Date().toISOString(),
    since: since?.toISOString() ?? null,
    unreadNotifications,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      category: n.category,
      href: n.href,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    liveChats,
    openTasks,
    openTickets,
    modules,
  };
}
