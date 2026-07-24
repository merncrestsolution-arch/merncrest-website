import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { writeAuditLog } from "@/lib/erp/audit";
import {
  dispatchDueScheduled,
  getNotificationAnalytics,
  notifyWithPrefs,
} from "@/lib/erp/notify-center";

/** Staff notification center: prefs, history, schedule, analytics, announcements */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "inbox";

  if (view === "prefs") {
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: auth.user.id },
    });
    return NextResponse.json({
      prefs: prefs || {
        email: true,
        whatsapp: true,
        sms: false,
        push: true,
        inApp: true,
        dndStart: null,
        dndEnd: null,
      },
    });
  }

  if (view === "analytics") {
    const analytics = await getNotificationAnalytics(30);
    return NextResponse.json({ analytics });
  }

  if (view === "scheduled") {
    const scheduled = await prisma.scheduledNotification.findMany({
      where: { OR: [{ userId: auth.user.id }, { broadcast: true }] },
      orderBy: { sendAt: "asc" },
      take: 40,
    });
    return NextResponse.json({ scheduled });
  }

  if (view === "announcements") {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ announcements });
  }

  const archive = searchParams.get("archive") === "1";
  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      ...(archive ? { readAt: { not: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const unread = await prisma.notification.count({
    where: { userId: auth.user.id, readAt: null },
  });
  return NextResponse.json({ notifications, unread });
}

const postSchema = z.object({
  action: z.enum([
    "prefs",
    "schedule",
    "broadcast",
    "announce",
    "dispatch",
    "open",
    "click",
    "test",
  ]),
  email: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  dndStart: z.string().nullable().optional(),
  dndEnd: z.string().nullable().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  channel: z.enum(["IN_APP", "EMAIL", "WHATSAPP", "SMS", "PUSH"]).optional(),
  sendAt: z.string().optional(),
  href: z.string().optional(),
  tone: z.enum(["INFO", "WARNING", "SUCCESS", "PROMO"]).optional(),
  notificationId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const d = parsed.data;

  if (d.action === "prefs") {
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: auth.user.id },
      create: {
        userId: auth.user.id,
        email: d.email ?? true,
        whatsapp: d.whatsapp ?? true,
        sms: d.sms ?? false,
        push: d.push ?? true,
        inApp: d.inApp ?? true,
        dndStart: d.dndStart,
        dndEnd: d.dndEnd,
      },
      update: {
        email: d.email,
        whatsapp: d.whatsapp,
        sms: d.sms,
        push: d.push,
        inApp: d.inApp,
        dndStart: d.dndStart,
        dndEnd: d.dndEnd,
      },
    });
    return NextResponse.json({ prefs });
  }

  if (d.action === "schedule" && d.title && d.body && d.sendAt) {
    const row = await prisma.scheduledNotification.create({
      data: {
        userId: d.userId || auth.user.id,
        title: d.title,
        body: d.body,
        channel: d.channel || "IN_APP",
        href: d.href,
        sendAt: new Date(d.sendAt),
      },
    });
    return NextResponse.json({ scheduled: row }, { status: 201 });
  }

  if (d.action === "broadcast" && d.title && d.body) {
    if (!["ADMIN", "OWNER"].includes(auth.user.role)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const row = await prisma.scheduledNotification.create({
      data: {
        broadcast: true,
        title: d.title,
        body: d.body,
        channel: "IN_APP",
        href: d.href,
        sendAt: d.sendAt ? new Date(d.sendAt) : new Date(),
        status: d.sendAt ? "PENDING" : "PENDING",
      },
    });
    if (!d.sendAt) {
      await dispatchDueScheduled();
    }
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "NOTIFICATIONS",
      entityType: "ScheduledNotification",
      entityId: row.id,
      summary: `Broadcast: ${d.title}`,
    });
    return NextResponse.json({ scheduled: row }, { status: 201 });
  }

  if (d.action === "announce" && d.title && d.body) {
    if (!["ADMIN", "OWNER"].includes(auth.user.role)) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const announcement = await prisma.announcement.create({
      data: {
        title: d.title,
        body: d.body,
        tone: d.tone || "INFO",
        href: d.href,
        active: true,
      },
    });
    return NextResponse.json({ announcement }, { status: 201 });
  }

  if (d.action === "dispatch") {
    const result = await dispatchDueScheduled();
    return NextResponse.json(result);
  }

  if (d.action === "open" && d.notificationId) {
    await prisma.notificationEvent.create({
      data: { notificationId: d.notificationId, channel: "IN_APP", event: "OPENED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (d.action === "click" && d.notificationId) {
    await prisma.notificationEvent.create({
      data: { notificationId: d.notificationId, channel: "IN_APP", event: "CLICKED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (d.action === "test") {
    const result = await notifyWithPrefs({
      userId: auth.user.id,
      title: d.title || "Test notification",
      body: d.body || "Notification center test from System.merncrest.lk",
      channels: ["IN_APP", "WHATSAPP"],
    });
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Incomplete" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (Array.isArray(body.ids) && body.ids.length) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, id: { in: body.ids } },
      data: { readAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
