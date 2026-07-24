import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { notifyUser } from "@/lib/support/notify";
import { getTeamAvailability, roomsFree } from "@/lib/erp/calendar";
import { nextRecurrenceDate } from "@/lib/erp/projects/recurrence";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "mine";

  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + 60);

  if (view === "availability") {
    const availability = await getTeamAvailability(from, to);
    return NextResponse.json({ availability });
  }

  if (view === "rooms") {
    const starts = searchParams.get("startsAt")
      ? new Date(searchParams.get("startsAt")!)
      : new Date();
    const ends = searchParams.get("endsAt")
      ? new Date(searchParams.get("endsAt")!)
      : new Date(Date.now() + 3600000);
    const rooms = await roomsFree(starts, ends);
    const all = await prisma.meetingRoom.findMany({ where: { active: true } });
    return NextResponse.json({ rooms: rooms.length ? rooms : all.map((r) => ({ ...r, free: true })) });
  }

  const [events, holidays, leaves] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        startsAt: { gte: from, lte: to },
        OR: [
          { ownerId: auth.user.id },
          { shared: true },
          { attendeesJson: { contains: auth.user.id } },
        ],
      },
      include: { room: true },
      orderBy: { startsAt: "asc" },
      take: 120,
    }),
    prisma.holidayCalendar.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: to },
        endDate: { gte: from },
        ...(view === "team" ? {} : { userId: auth.user.id }),
      },
      include: { user: { select: { fullName: true } } },
      take: 80,
    }),
  ]);

  return NextResponse.json({ events, holidays, leaves });
}

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  kind: z.enum(["MEETING", "HOLIDAY", "LEAVE", "REMINDER", "OTHER"]).optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
  allDay: z.boolean().optional(),
  shared: z.boolean().optional(),
  attendeesJson: z.string().optional(),
  roomId: z.string().optional(),
  recurrence: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).optional(),
  notes: z.string().optional(),
  actionItemsJson: z.string().optional(),
  reminderAt: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "room") {
    if (!["ADMIN", "OWNER"].includes(auth.user.role)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const room = await prisma.meetingRoom.create({
      data: {
        name: body.name || "Meeting room",
        capacity: body.capacity || 4,
        location: body.location,
      },
    });
    return NextResponse.json({ room }, { status: 201 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);

  if (parsed.data.roomId) {
    const free = await roomsFree(startsAt, endsAt);
    const room = free.find((r) => r.id === parsed.data.roomId);
    if (room && room.free === false) {
      return NextResponse.json({ error: "Room not available" }, { status: 409 });
    }
  }

  const event = await prisma.calendarEvent.create({
    data: {
      ownerId: auth.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      startsAt,
      endsAt,
      kind: parsed.data.kind || "MEETING",
      location: parsed.data.location,
      meetingUrl: parsed.data.meetingUrl,
      allDay: parsed.data.allDay ?? false,
      shared: parsed.data.shared ?? false,
      attendeesJson: parsed.data.attendeesJson,
      roomId: parsed.data.roomId,
      recurrence: parsed.data.recurrence || "NONE",
      notes: parsed.data.notes,
      actionItemsJson: parsed.data.actionItemsJson,
      reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : undefined,
    },
  });

  if (parsed.data.roomId) {
    await prisma.roomBooking.create({
      data: {
        roomId: parsed.data.roomId,
        eventId: event.id,
        bookedById: auth.user.id,
        startsAt,
        endsAt,
      },
    });
  }

  // Spawn next occurrence for recurring meetings
  if (parsed.data.recurrence && parsed.data.recurrence !== "NONE") {
    const nextStart = nextRecurrenceDate(startsAt, parsed.data.recurrence);
    const nextEnd = nextRecurrenceDate(endsAt, parsed.data.recurrence);
    if (nextStart && nextEnd) {
      await prisma.calendarEvent.create({
        data: {
          ownerId: auth.user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          startsAt: nextStart,
          endsAt: nextEnd,
          kind: parsed.data.kind || "MEETING",
          location: parsed.data.location,
          meetingUrl: parsed.data.meetingUrl,
          shared: parsed.data.shared ?? false,
          roomId: parsed.data.roomId,
          recurrence: parsed.data.recurrence,
          notes: "Auto-created recurrence",
        },
      });
    }
  }

  if (parsed.data.reminderAt || parsed.data.kind === "REMINDER") {
    await notifyUser({
      userId: auth.user.id,
      title: `Reminder: ${event.title}`,
      body: `Scheduled ${startsAt.toLocaleString()}`,
      category: "SYSTEM",
      href: "/staff/calendar",
    });
  }

  // Notify attendees
  if (parsed.data.attendeesJson) {
    try {
      const ids = JSON.parse(parsed.data.attendeesJson) as string[];
      for (const id of ids) {
        if (id === auth.user.id) continue;
        void notifyUser({
          userId: id,
          title: `Meeting: ${event.title}`,
          body: `${startsAt.toLocaleString()}${parsed.data.meetingUrl ? ` · ${parsed.data.meetingUrl}` : ""}`,
          category: "SYSTEM",
          href: "/staff/calendar",
        });
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const event = await prisma.calendarEvent.update({
    where: { id: body.id },
    data: {
      notes: body.notes,
      actionItemsJson: body.actionItemsJson,
      meetingUrl: body.meetingUrl,
      title: body.title,
    },
  });
  return NextResponse.json({ event });
}
