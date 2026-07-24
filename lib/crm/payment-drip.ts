import { prisma } from "@/lib/db";
import { sendWhatsAppRich } from "@/lib/support/whatsapp-rich";
import { formatMoney } from "@/lib/commerce-format";

export type DripStep = {
  /** Days after enrollment (0 = immediate / due day) */
  dayOffset: number;
  bodyTemplate: string;
  templateName?: string;
};

const DEFAULT_STEPS: DripStep[] = [
  {
    dayOffset: 0,
    bodyTemplate:
      "Hi {{name}}, invoice {{invoiceNumber}} for {{amount}} is due. Pay at merncrest.lk/portal/invoices",
    templateName: "payment_due_d0",
  },
  {
    dayOffset: 3,
    bodyTemplate:
      "Reminder: {{invoiceNumber}} ({{amount}}) is still unpaid. Reply PAY for bank details or open the portal.",
    templateName: "payment_due_d3",
  },
  {
    dayOffset: 7,
    bodyTemplate:
      "Final notice: {{invoiceNumber}} overdue. Please settle {{amount}} today to avoid service interruption.",
    templateName: "payment_due_d7",
  },
];

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

export async function ensureDefaultPaymentDripSequence() {
  const existing = await prisma.paymentDripSequence.findFirst({
    where: { name: "Invoice overdue drip" },
  });
  if (existing) return existing;
  return prisma.paymentDripSequence.create({
    data: {
      name: "Invoice overdue drip",
      description: "Day 0 / +3 / +7 payment reminders via WhatsApp",
      stepsJson: JSON.stringify(DEFAULT_STEPS),
      active: true,
    },
  });
}

/** Enroll open/overdue invoices into the default drip (idempotent per invoice). */
export async function enrollOverdueInvoicesInDrip(limit = 40) {
  const seq = await ensureDefaultPaymentDripSequence();
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["SENT", "OVERDUE"] },
      OR: [{ dueAt: { lte: new Date() } }, { dueAt: null }],
    },
    include: {
      user: {
        include: { profile: { select: { phone: true, whatsapp: true } } },
      },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let enrolled = 0;
  for (const inv of invoices) {
    const phone = inv.user.profile?.whatsapp || inv.user.profile?.phone || "";
    if (!phone) continue;

    const existing = await prisma.paymentDripEnrollment.findFirst({
      where: {
        invoiceId: inv.id,
        sequenceId: seq.id,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
    });
    if (existing) continue;

    await prisma.paymentDripEnrollment.create({
      data: {
        sequenceId: seq.id,
        invoiceId: inv.id,
        userId: inv.userId,
        phone: phone.replace(/\D/g, ""),
        currentStep: 0,
        nextRunAt: new Date(),
        status: "ACTIVE",
        varsJson: JSON.stringify({
          name: inv.user.fullName,
          invoiceNumber: inv.invoiceNumber,
          amount: formatMoney(inv.totalCents),
        }),
      },
    });
    enrolled++;
  }
  return { sequenceId: seq.id, candidates: invoices.length, enrolled };
}

/** Process due drip steps (call from cron or System WA actions). */
export async function processPaymentDrips(limit = 50) {
  const due = await prisma.paymentDripEnrollment.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: new Date() } },
    include: { sequence: true },
    take: limit,
    orderBy: { nextRunAt: "asc" },
  });

  let sent = 0;
  let completed = 0;
  let failed = 0;

  for (const en of due) {
    let steps: DripStep[] = [];
    try {
      steps = JSON.parse(en.sequence.stepsJson) as DripStep[];
    } catch {
      await prisma.paymentDripEnrollment.update({
        where: { id: en.id },
        data: { status: "CANCELLED" },
      });
      failed++;
      continue;
    }

    const step = steps[en.currentStep];
    if (!step) {
      await prisma.paymentDripEnrollment.update({
        where: { id: en.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      completed++;
      continue;
    }

    // Skip if invoice already paid
    if (en.invoiceId) {
      const inv = await prisma.invoice.findUnique({ where: { id: en.invoiceId } });
      if (inv && (inv.status === "PAID" || inv.status === "CANCELLED")) {
        await prisma.paymentDripEnrollment.update({
          where: { id: en.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        completed++;
        continue;
      }
    }

    let vars: Record<string, string> = {};
    try {
      vars = en.varsJson ? JSON.parse(en.varsJson) : {};
    } catch {
      vars = {};
    }

    const body = render(step.bodyTemplate, vars);
    const result = await sendWhatsAppRich({
      phone: en.phone,
      body,
      templateName: step.templateName,
    });

    if (!result.ok) {
      failed++;
      await prisma.paymentDripEnrollment.update({
        where: { id: en.id },
        data: { lastError: "send_failed", lastSentAt: new Date() },
      });
      continue;
    }

    sent++;
    const nextIdx = en.currentStep + 1;
    if (nextIdx >= steps.length) {
      await prisma.paymentDripEnrollment.update({
        where: { id: en.id },
        data: {
          currentStep: nextIdx,
          status: "COMPLETED",
          lastSentAt: new Date(),
          lastError: null,
          completedAt: new Date(),
        },
      });
      completed++;
    } else {
      const next = steps[nextIdx];
      const daysAhead = Math.max(0, (next.dayOffset || 0) - (step.dayOffset || 0));
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + (daysAhead || 1));
      await prisma.paymentDripEnrollment.update({
        where: { id: en.id },
        data: {
          currentStep: nextIdx,
          nextRunAt: nextRun,
          lastSentAt: new Date(),
          lastError: null,
        },
      });
    }
  }

  return { due: due.length, sent, completed, failed };
}
