import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { normalizePhone } from "@/lib/support/ivr/gateway";
import type { IvrUseCase } from "@/lib/support/ivr/menu";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type UseCaseResult = {
  ok: boolean;
  useCase: IvrUseCase;
  message: string;
  promptKey: string;
  data?: Record<string, unknown>;
};

/** Staff attendance punch-in via caller phone */
export async function runAttendanceUseCase(phone: string): Promise<UseCaseResult> {
  const digits = normalizePhone(phone);
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { phone: { contains: digits.slice(-9) } },
        { workPhone: { contains: digits.slice(-9) } },
      ],
    },
  });

  if (!employee) {
    return {
      ok: false,
      useCase: "ATTENDANCE",
      message: "No employee matched this phone. Contact HR.",
      promptKey: "prompt.attendance_fail",
    };
  }

  const day = startOfDay();
  let record = await prisma.attendanceRecord.findFirst({
    where: { employeeId: employee.id, workDate: day },
  });
  const now = new Date();

  if (record?.checkIn && !record.checkOut) {
    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOut: now, notes: "IVR punch-out" },
    });
    return {
      ok: true,
      useCase: "ATTENDANCE",
      message: `Punch-out recorded for ${employee.fullName}.`,
      promptKey: "prompt.attendance_ok",
      data: { employeeId: employee.id, action: "OUT", recordId: record.id },
    };
  }

  if (record?.checkIn && record.checkOut) {
    return {
      ok: false,
      useCase: "ATTENDANCE",
      message: "Already punched in and out today.",
      promptKey: "prompt.attendance_fail",
      data: { employeeId: employee.id },
    };
  }

  const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
  record = record
    ? await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkIn: now,
          status: late ? "LATE" : "PRESENT",
          notes: "IVR punch-in",
          userId: employee.userId || undefined,
        },
      })
    : await prisma.attendanceRecord.create({
        data: {
          employeeId: employee.id,
          userId: employee.userId || undefined,
          workDate: day,
          checkIn: now,
          status: late ? "LATE" : "PRESENT",
          notes: "IVR punch-in",
        },
      });

  return {
    ok: true,
    useCase: "ATTENDANCE",
    message: `Punch-in recorded for ${employee.fullName}${late ? " (late)" : ""}.`,
    promptKey: "prompt.attendance_ok",
    data: { employeeId: employee.id, action: "IN", recordId: record.id, late },
  };
}

/** Order status by phone → latest order, or by order number digits */
export async function runOrderStatusUseCase(opts: {
  phone: string;
  orderDigits?: string;
}): Promise<UseCaseResult> {
  const digits = normalizePhone(opts.phone);
  let order = opts.orderDigits
    ? await prisma.order.findFirst({
        where: { orderNumber: { contains: opts.orderDigits.replace(/\D/g, "") } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!order) {
    const profile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          { phone: { contains: digits.slice(-9) } },
          { whatsapp: { contains: digits.slice(-9) } },
        ],
      },
    });
    if (profile) {
      order = await prisma.order.findFirst({
        where: { userId: profile.userId },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  if (!order) {
    return {
      ok: false,
      useCase: "ORDER_STATUS",
      message: "No order found for this number.",
      promptKey: "prompt.invalid",
    };
  }

  return {
    ok: true,
    useCase: "ORDER_STATUS",
    message: `Order ${order.orderNumber} status is ${order.status}.`,
    promptKey: "usecase.order",
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
    },
  };
}

/** Payment / invoice inquiry */
export async function runPaymentUseCase(phone: string): Promise<UseCaseResult> {
  const digits = normalizePhone(phone);
  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [
        { phone: { contains: digits.slice(-9) } },
        { whatsapp: { contains: digits.slice(-9) } },
      ],
    },
  });

  if (!profile) {
    return {
      ok: false,
      useCase: "PAYMENT",
      message: "No customer account matched this phone.",
      promptKey: "prompt.invalid",
    };
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      userId: profile.userId,
      status: { in: ["SENT", "OVERDUE"] },
    },
    orderBy: { dueAt: "asc" },
  });

  if (!invoice) {
    return {
      ok: true,
      useCase: "PAYMENT",
      message: "No pending invoices. Account is clear.",
      promptKey: "usecase.payment",
      data: { clear: true },
    };
  }

  return {
    ok: true,
    useCase: "PAYMENT",
    message: `Invoice ${invoice.invoiceNumber} is ${invoice.status}. Amount ${(invoice.totalCents / 100).toFixed(2)} ${invoice.currency}.`,
    promptKey: "usecase.payment",
    data: {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
      dueAt: invoice.dueAt,
    },
  };
}

/** Create helpdesk ticket from phone */
export async function runTicketUseCase(opts: {
  phone: string;
  fullName?: string;
  department: string;
  body?: string;
  severity?: string;
  userId?: string | null;
}): Promise<UseCaseResult> {
  const priority =
    opts.severity === "CRITICAL"
      ? "URGENT"
      : opts.severity === "HIGH"
        ? "HIGH"
        : opts.severity === "LOW"
          ? "LOW"
          : "MEDIUM";

  const ticketDept =
    opts.department === "SALES"
      ? "SALES"
      : opts.department === "BILLING"
        ? "BILLING"
        : opts.department === "HOSTING" || opts.department === "DOMAIN"
          ? "TECHNICAL"
          : "GENERAL";

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: nextNumber("TKT"),
      userId: opts.userId || undefined,
      guestName: opts.fullName || `Caller ${opts.phone}`,
      subject: `IVR phone ticket · ${opts.department}`,
      department: ticketDept,
      priority,
      channel: "IVR",
      status: "OPEN",
      messages: {
        create: {
          authorName: opts.fullName || opts.phone,
          authorRole: "CUSTOMER",
          body:
            opts.body ||
            `Phone ticket from ${opts.phone}. Department ${opts.department}${opts.severity ? ` · severity ${opts.severity}` : ""}.`,
        },
      },
    },
  });

  return {
    ok: true,
    useCase: "TICKET",
    message: `Ticket ${ticket.ticketNumber} created.`,
    promptKey: "usecase.ticket",
    data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, priority },
  };
}

/** Queue an appointment callback slot */
export async function runAppointmentUseCase(opts: {
  phone: string;
  fullName?: string;
  userId?: string | null;
  preferredAt?: string;
  notes?: string;
}): Promise<UseCaseResult> {
  const cb = await prisma.callbackRequest.create({
    data: {
      userId: opts.userId || undefined,
      fullName: opts.fullName || `Caller ${opts.phone}`,
      phone: opts.phone,
      reason: "SUPPORT",
      preferredAt: opts.preferredAt || "Next business day",
      notes: opts.notes || "IVR appointment request",
      status: "PENDING",
    },
  });

  return {
    ok: true,
    useCase: "APPOINTMENT",
    message: "Appointment callback queued. We will call you back.",
    promptKey: "usecase.appointment",
    data: { callbackId: cb.id, preferredAt: cb.preferredAt },
  };
}

export function surveyLabel(score: number) {
  if (score >= 5) return "Excellent";
  if (score === 4) return "Good";
  if (score === 3) return "Average";
  if (score === 2) return "Poor";
  return "Very poor";
}
