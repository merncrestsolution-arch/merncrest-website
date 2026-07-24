import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { sendWhatsAppRich } from "@/lib/support/whatsapp-rich";
import { writeAuditLog } from "@/lib/erp/audit";

/** System WhatsApp inbox + templates + automations */
export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");

  const [conversations, templates, automations, recent] = await Promise.all([
    prisma.whatsAppConversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    }),
    prisma.whatsAppTemplate.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.whatsAppAutomation.findMany({ orderBy: { trigger: "asc" } }),
    phone
      ? prisma.whatsAppMessage.findMany({
          where: { phone: phone.replace(/\D/g, "") },
          orderBy: { createdAt: "asc" },
          take: 100,
        })
      : prisma.whatsAppMessage.findMany({
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
  ]);

  const { getWhatsAppBusinessConfig } = await import("@/lib/crm/whatsapp-enable");
  const { getWhatsAppConnectionStatus } = await import("@/lib/support/whatsapp-meta");
  const [business, status] = await Promise.all([
    getWhatsAppBusinessConfig(),
    getWhatsAppConnectionStatus(),
  ]);

  return NextResponse.json({
    conversations,
    templates,
    automations,
    messages: recent,
    business,
    status,
  });
}

const replySchema = z.object({
  action: z.literal("REPLY"),
  phone: z.string().min(8),
  body: z.string().min(1).max(4000),
  templateName: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "document", "video"]).optional(),
  scheduleAt: z.string().optional(),
});

const assignSchema = z.object({
  action: z.literal("ASSIGN"),
  conversationId: z.string(),
  assigneeId: z.string().nullable(),
});

const templateSchema = z.object({
  action: z.literal("TEMPLATE"),
  name: z.string().min(2),
  body: z.string().min(2),
  category: z.string().optional(),
  locale: z.string().optional(),
  providerKey: z.string().optional(),
});

const automationSchema = z.object({
  action: z.literal("AUTOMATION"),
  name: z.string().min(2),
  trigger: z.enum([
    "INQUIRY",
    "NEW_ORDER",
    "PAYMENT_DUE",
    "LEAVE_STATUS",
    "TASK_ASSIGN",
    "TICKET_UPDATE",
    "ATTENDANCE",
  ]),
  bodyTemplate: z.string().min(2),
  active: z.boolean().optional(),
});

const rateSchema = z.object({
  action: z.literal("RATE"),
  messageId: z.string(),
  qualityRating: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.action === "REPLY") {
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });

    if (parsed.data.scheduleAt) {
      const phone = parsed.data.phone.replace(/\D/g, "");
      const conv = await prisma.whatsAppConversation.upsert({
        where: { phone },
        create: { phone, status: "OPEN", lastMessageAt: new Date() },
        update: {},
      });
      const msg = await prisma.whatsAppMessage.create({
        data: {
          direction: "OUT",
          phone,
          body: parsed.data.body,
          status: "SCHEDULED",
          scheduledAt: new Date(parsed.data.scheduleAt),
          conversationId: conv.id,
          assigneeId: auth.user.id,
          templateName: parsed.data.templateName || null,
          mediaUrl: parsed.data.mediaUrl || null,
          mediaType: parsed.data.mediaType || null,
        },
      });
      return NextResponse.json({ message: msg, scheduled: true }, { status: 201 });
    }

    const result = await sendWhatsAppRich({
      phone: parsed.data.phone,
      body: parsed.data.body,
      templateName: parsed.data.templateName,
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      assigneeId: auth.user.id,
    });

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "CREATE",
      module: "WHATSAPP",
      entityType: "WhatsAppMessage",
      entityId: result.message?.id,
      summary: `WA reply to ${parsed.data.phone}`,
    });

    return NextResponse.json(result, { status: result.ok ? 201 : 502 });
  }

  if (body.action === "ASSIGN") {
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid assign" }, { status: 400 });
    const conv = await prisma.whatsAppConversation.update({
      where: { id: parsed.data.conversationId },
      data: {
        assigneeId: parsed.data.assigneeId,
        status: parsed.data.assigneeId ? "ASSIGNED" : "OPEN",
      },
    });
    return NextResponse.json({ conversation: conv });
  }

  if (body.action === "TEMPLATE") {
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid template" }, { status: 400 });
    const tpl = await prisma.whatsAppTemplate.upsert({
      where: { name: parsed.data.name },
      create: {
        name: parsed.data.name,
        body: parsed.data.body,
        category: parsed.data.category || "UTILITY",
        locale: parsed.data.locale || "EN",
        providerKey: parsed.data.providerKey,
        status: "LOCAL",
      },
      update: {
        body: parsed.data.body,
        category: parsed.data.category,
        locale: parsed.data.locale,
        providerKey: parsed.data.providerKey,
        active: true,
      },
    });
    return NextResponse.json({ template: tpl }, { status: 201 });
  }

  if (body.action === "AUTOMATION") {
    const parsed = automationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid automation" }, { status: 400 });
    const row = await prisma.whatsAppAutomation.create({
      data: {
        name: parsed.data.name,
        trigger: parsed.data.trigger,
        bodyTemplate: parsed.data.bodyTemplate,
        active: parsed.data.active ?? true,
      },
    });
    return NextResponse.json({ automation: row }, { status: 201 });
  }

  if (body.action === "RATE") {
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    const msg = await prisma.whatsAppMessage.update({
      where: { id: parsed.data.messageId },
      data: { qualityRating: parsed.data.qualityRating },
    });
    if (msg.conversationId) {
      const rated = await prisma.whatsAppMessage.findMany({
        where: { conversationId: msg.conversationId, qualityRating: { not: null } },
        select: { qualityRating: true },
      });
      const avg =
        rated.reduce((s, r) => s + (r.qualityRating || 0), 0) / (rated.length || 1);
      await prisma.whatsAppConversation.update({
        where: { id: msg.conversationId },
        data: { qualityAvg: avg },
      });
    }
    return NextResponse.json({ message: msg });
  }

  if (body.action === "BULK") {
    const phones = z.array(z.string()).parse(body.phones || []);
    const text = z.string().min(1).parse(body.body);
    const results = [];
    for (const phone of phones.slice(0, 50)) {
      results.push(
        await sendWhatsAppRich({
          phone,
          body: text,
          templateName: body.templateName,
          assigneeId: auth.user.id,
        })
      );
    }
    return NextResponse.json({ sent: results.filter((r) => r.ok).length, results });
  }

  // Dispatch due scheduled messages
  if (body.action === "FLUSH_SCHEDULED") {
    const due = await prisma.whatsAppMessage.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
      take: 50,
    });
    let sent = 0;
    for (const m of due) {
      const r = await sendWhatsAppRich({
        phone: m.phone,
        body: m.body,
        templateName: m.templateName || undefined,
        mediaUrl: m.mediaUrl || undefined,
        mediaType: (m.mediaType as "image" | "document" | "video") || undefined,
        conversationId: m.conversationId || undefined,
        assigneeId: auth.user.id,
      });
      await prisma.whatsAppMessage.update({
        where: { id: m.id },
        data: { status: r.ok ? "SENT" : "FAILED" },
      });
      if (r.ok) sent++;
    }
    return NextResponse.json({ due: due.length, sent });
  }

  // Meta Cloud API — sync template approval status
  if (body.action === "SYNC_TEMPLATES") {
    const { syncMetaWhatsAppTemplates } = await import("@/lib/crm/whatsapp-template-sync");
    const result = await syncMetaWhatsAppTemplates();
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "WHATSAPP",
      entityType: "WhatsAppTemplate",
      summary: `Meta template sync: ${result.synced} synced`,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }

  // Wire business number 0713838638 + turn on every automation / drip / NLU
  if (body.action === "ENABLE_FULL_AUTOMATION") {
    const { enableFullWhatsAppAutomation } = await import("@/lib/crm/whatsapp-enable");
    const result = await enableFullWhatsAppAutomation();
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "SETTINGS",
      module: "WHATSAPP",
      entityType: "SystemGatewayConfig",
      entityId: result.gatewayId,
      summary: `Enabled full WA automation on ${result.businessNumber}`,
    });
    return NextResponse.json(result);
  }

  // Multi-day payment drip: enroll overdue invoices
  if (body.action === "ENROLL_PAYMENT_DRIPS") {
    const { enrollOverdueInvoicesInDrip } = await import("@/lib/crm/payment-drip");
    const result = await enrollOverdueInvoicesInDrip(40);
    return NextResponse.json(result);
  }

  // Process due drip steps (day 0 / +3 / +7)
  if (body.action === "PROCESS_PAYMENT_DRIPS") {
    const { processPaymentDrips } = await import("@/lib/crm/payment-drip");
    const result = await processPaymentDrips(50);
    return NextResponse.json(result);
  }

  // Payment due → one-shot reminder + enroll enroll (compat)
  if (body.action === "PAYMENT_REMINDERS") {
    const { notifyPaymentDueWhatsApp } = await import("@/lib/crm/whatsapp-notify");
    const { formatMoney } = await import("@/lib/commerce-format");
    const { enrollOverdueInvoicesInDrip, processPaymentDrips } = await import(
      "@/lib/crm/payment-drip"
    );
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "OVERDUE"] },
        OR: [{ dueAt: { lte: new Date() } }, { dueAt: null }],
      },
      take: 40,
      orderBy: { createdAt: "asc" },
    });
    let sent = 0;
    for (const inv of invoices) {
      const r = await notifyPaymentDueWhatsApp({
        userId: inv.userId,
        invoiceNumber: inv.invoiceNumber,
        amount: formatMoney(inv.totalCents),
      });
      if (r.ok) {
        sent++;
        if (inv.status === "SENT" && inv.dueAt && inv.dueAt < new Date()) {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: "OVERDUE" },
          });
        }
      }
    }
    const enrolled = await enrollOverdueInvoicesInDrip(40);
    const drips = await processPaymentDrips(50);
    return NextResponse.json({
      invoices: invoices.length,
      sent,
      dripEnrolled: enrolled.enrolled,
      dripProcessed: drips,
    });
  }

  // Meta/Twilio delivery status callback simulation / webhook body
  if (body.action === "STATUS") {
    const schema = z.object({
      messageId: z.string().optional(),
      waId: z.string().optional(),
      status: z.enum(["SENT", "DELIVERED", "READ", "FAILED"]),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const msg = await prisma.whatsAppMessage.findFirst({
      where: parsed.data.messageId
        ? { id: parsed.data.messageId }
        : { waId: parsed.data.waId || "" },
    });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.whatsAppMessage.update({
      where: { id: msg.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ message: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
