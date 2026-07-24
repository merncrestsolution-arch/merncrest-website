import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/support/notify";

export function isInDndWindow(prefs: {
  dndStart?: string | null;
  dndEnd?: string | null;
}, now = new Date()) {
  if (!prefs.dndStart || !prefs.dndEnd) return false;
  const [sh, sm] = prefs.dndStart.split(":").map(Number);
  const [eh, em] = prefs.dndEnd.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start <= end) return mins >= start && mins < end;
  return mins >= start || mins < end;
}

/** Respect prefs + DND when delivering in-app (and optionally WhatsApp) */
export async function notifyWithPrefs(opts: {
  userId: string;
  title: string;
  body: string;
  category?: string;
  href?: string;
  channels?: ("IN_APP" | "WHATSAPP" | "EMAIL" | "SMS" | "PUSH")[];
}) {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: opts.userId },
  });
  const channels = opts.channels || ["IN_APP"];

  if (prefs && isInDndWindow(prefs)) {
    await prisma.scheduledNotification.create({
      data: {
        userId: opts.userId,
        title: opts.title,
        body: opts.body,
        channel: channels[0] || "IN_APP",
        href: opts.href,
        sendAt: new Date(Date.now() + 60 * 60 * 1000),
        status: "SKIPPED_DND",
      },
    });
    return { ok: false, reason: "dnd" as const };
  }

  const results: Record<string, boolean> = {};

  if (channels.includes("IN_APP") && (prefs?.inApp !== false)) {
    const n = await notifyUser({
      userId: opts.userId,
      title: opts.title,
      body: opts.body,
      category: opts.category,
      href: opts.href,
    });
    await prisma.notificationEvent.create({
      data: { notificationId: n.id, channel: "IN_APP", event: "SENT" },
    });
    results.IN_APP = true;
  }

  if (channels.includes("WHATSAPP") && prefs?.whatsapp !== false) {
    const { runWhatsAppAutomation } = await import("@/lib/crm/whatsapp-notify");
    const r = await runWhatsAppAutomation({
      trigger: "CUSTOM",
      userId: opts.userId,
      bodyFallback: `${opts.title}\n${opts.body}`,
    });
    results.WHATSAPP = Boolean(r.ok);
    await prisma.notificationEvent.create({
      data: {
        channel: "WHATSAPP",
        event: r.ok ? "SENT" : "FAILED",
        metaJson: JSON.stringify(r),
      },
    });
  }

  // SMS / PUSH / EMAIL — gateway stubs (log events only until wired)
  for (const ch of ["SMS", "PUSH", "EMAIL"] as const) {
    if (!channels.includes(ch)) continue;
    const allowed =
      ch === "SMS" ? prefs?.sms : ch === "PUSH" ? prefs?.push !== false : prefs?.email !== false;
    if (!allowed) continue;
    await prisma.notificationEvent.create({
      data: {
        channel: ch,
        event: "SENT",
        metaJson: JSON.stringify({ stub: true, title: opts.title }),
      },
    });
    results[ch] = true;
  }

  return { ok: true, results };
}

export async function getNotificationAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await prisma.notificationEvent.groupBy({
    by: ["channel", "event"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const sent = events.filter((e) => e.event === "SENT").reduce((a, e) => a + e._count._all, 0);
  const opened = events.filter((e) => e.event === "OPENED").reduce((a, e) => a + e._count._all, 0);
  const clicked = events.filter((e) => e.event === "CLICKED").reduce((a, e) => a + e._count._all, 0);
  return {
    days,
    sent,
    opened,
    clicked,
    openRate: sent ? Math.round((opened / sent) * 1000) / 10 : 0,
    clickRate: sent ? Math.round((clicked / sent) * 1000) / 10 : 0,
    byChannel: events,
  };
}

export async function dispatchDueScheduled() {
  const due = await prisma.scheduledNotification.findMany({
    where: { status: "PENDING", sendAt: { lte: new Date() } },
    take: 50,
  });
  let sent = 0;
  for (const row of due) {
    if (row.userId) {
      await notifyWithPrefs({
        userId: row.userId,
        title: row.title,
        body: row.body,
        href: row.href || undefined,
        channels: [row.channel as "IN_APP"],
      });
    } else if (row.broadcast) {
      const staff = await prisma.user.findMany({
        where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
        select: { id: true },
        take: 200,
      });
      for (const u of staff) {
        await notifyWithPrefs({
          userId: u.id,
          title: row.title,
          body: row.body,
          href: row.href || undefined,
        });
      }
    }
    await prisma.scheduledNotification.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    sent += 1;
  }
  return { sent };
}
