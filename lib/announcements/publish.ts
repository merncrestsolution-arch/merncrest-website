import { prisma } from "@/lib/db";
import { publishAnnouncementSync } from "@/lib/platform/publish";

/** Publish scheduled announcements whose scheduledFor has passed. */
export async function publishDueAnnouncements(): Promise<{ published: number }> {
  const now = new Date();
  const due = await prisma.announcement.findMany({
    where: {
      deletedAt: null,
      status: "SCHEDULED",
      scheduledFor: { lte: now },
    },
    take: 50,
  });

  let published = 0;
  for (const row of due) {
    await publishAnnouncement(row.id);
    published += 1;
  }
  return { published };
}

export async function publishAnnouncement(announcementId: string) {
  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      status: "PUBLISHED",
      active: true,
      publishedAt: new Date(),
      startsAt: new Date(),
    },
  });

  if (announcement.surface === "STAFF" || announcement.surface === "BOTH") {
    const staffUsers = await getStaffAudience(announcement.audience, announcement.audienceJson);
    for (const userId of staffUsers) {
      await prisma.notification.create({
        data: {
          userId,
          title: announcement.title,
          body: announcement.body.slice(0, 500),
          href: announcement.href || "/staff/announcements",
          category: "ANNOUNCEMENT",
        },
      });
    }
  }

  if (announcement.surface === "PORTAL" || announcement.surface === "BOTH") {
    // Portal customers see via active announcement query — no per-user notify required
  }

  publishAnnouncementSync();

  return announcement;
}

async function getStaffAudience(audience: string, audienceJson: string | null): Promise<string[]> {
  if (audience === "ALL_STAFF") {
    const users = await prisma.user.findMany({
      where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  if (audience === "ROLE" && audienceJson) {
    try {
      const roles = JSON.parse(audienceJson) as string[];
      const users = await prisma.user.findMany({
        where: { role: { in: roles } },
        select: { id: true },
      });
      return users.map((u) => u.id);
    } catch {
      return [];
    }
  }

  if (audience === "TEAM" && audienceJson) {
    try {
      const orgRoles = JSON.parse(audienceJson) as string[];
      const employees = await prisma.employee.findMany({
        where: { orgRole: { in: orgRoles } },
        select: { userId: true },
      });
      return employees.map((e) => e.userId).filter(Boolean) as string[];
    } catch {
      return [];
    }
  }

  return [];
}

export async function matchesStaffAudience(
  userId: string,
  userRole: string,
  audience: string,
  audienceJson: string | null
): Promise<boolean> {
  if (audience === "ALL_STAFF") return ["STAFF", "ADMIN", "OWNER"].includes(userRole);
  if (audience === "ROLE" && audienceJson) {
    try {
      const roles = JSON.parse(audienceJson) as string[];
      return roles.includes(userRole);
    } catch {
      return false;
    }
  }
  if (audience === "TEAM" && audienceJson) {
    try {
      const orgRoles = JSON.parse(audienceJson) as string[];
      const emp = await prisma.employee.findFirst({
        where: { userId },
        select: { orgRole: true },
      });
      return emp?.orgRole ? orgRoles.includes(emp.orgRole) : false;
    } catch {
      return false;
    }
  }
  return false;
}
