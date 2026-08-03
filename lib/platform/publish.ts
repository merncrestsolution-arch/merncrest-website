import { prisma } from "@/lib/db";
import { publishPlatformSync } from "@/lib/platform/sync-events";

/** Push live KPI snapshot to all connected staff/mobile/web clients instantly. */
export async function publishStaffKpiSnapshot(userId?: string) {
  const [liveChats, openTickets] = await Promise.all([
    prisma.chatSession.count({
      where: { status: { in: ["OPEN", "HANDOFF", "PENDING"] } },
    }),
    prisma.ticket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
    }),
  ]);

  publishPlatformSync({
    type: "snapshot",
    liveChats,
    openTickets,
  });

  if (userId) {
    const [unreadNotifications, openTasks] = await Promise.all([
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.projectTask.count({
        where: { assigneeId: userId, status: { not: "DONE" } },
      }),
    ]);
    publishPlatformSync({
      type: "snapshot_user",
      userId,
      unreadNotifications,
      openTasks,
    });
  }
}

export function publishTaskUpdate(userId: string, taskId: string, status?: string) {
  publishPlatformSync({ type: "task", userId, id: taskId, status });
  void publishStaffKpiSnapshot(userId);
}

export function publishTicketUpdate(ticketId: string) {
  publishPlatformSync({ type: "ticket", id: ticketId });
  void publishStaffKpiSnapshot();
}

export function publishAnnouncementSync() {
  publishPlatformSync({ type: "announcement", audience: "staff" });
  void publishStaffKpiSnapshot();
}

export function publishCrmSync(entity: string, id: string) {
  publishPlatformSync({ type: "crm_update", entity, id });
}

export function publishAttendanceSync(userId: string) {
  publishPlatformSync({ type: "attendance", userId });
}
