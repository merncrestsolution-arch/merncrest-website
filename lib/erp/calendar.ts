import { prisma } from "@/lib/db";

export async function getTeamAvailability(from: Date, to: Date) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
    select: { id: true, fullName: true, email: true },
    take: 80,
  });

  const events = await prisma.calendarEvent.findMany({
    where: {
      startsAt: { lte: to },
      endsAt: { gte: from },
      OR: [{ shared: true }, { kind: "MEETING" }],
    },
    select: { ownerId: true, startsAt: true, endsAt: true, title: true, attendeesJson: true },
    take: 300,
  });

  const leaves = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      startDate: { lte: to },
      endDate: { gte: from },
    },
    select: { userId: true, startDate: true, endDate: true, leaveType: true },
    take: 100,
  });

  return staff.map((u) => {
    const busy = events.filter(
      (e) =>
        e.ownerId === u.id ||
        (e.attendeesJson && e.attendeesJson.includes(u.id))
    );
    const onLeave = leaves.filter((l) => l.userId === u.id);
    return {
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      busyCount: busy.length,
      onLeave: onLeave.length > 0,
      leave: onLeave,
      meetings: busy.slice(0, 5),
      available: onLeave.length === 0 && busy.length < 3,
    };
  });
}

export async function roomsFree(startsAt: Date, endsAt: Date) {
  const rooms = await prisma.meetingRoom.findMany({ where: { active: true } });
  const bookings = await prisma.roomBooking.findMany({
    where: {
      status: { not: "CANCELLED" },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  const busyIds = new Set(bookings.map((b) => b.roomId));
  return rooms.map((r) => ({ ...r, free: !busyIds.has(r.id) }));
}
