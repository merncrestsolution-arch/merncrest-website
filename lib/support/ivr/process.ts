import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { getSessionUser } from "@/lib/auth";
import { notifyUser } from "@/lib/support/notify";
import { writeAuditLog } from "@/lib/erp/audit";
import { getIvrGateway, normalizePhone } from "@/lib/support/ivr/gateway";
import {
  departmentFromKey,
  languageFromKey,
  menuSnapshot,
  type IvrUseCase,
} from "@/lib/support/ivr/menu";
import { sendMissedCallAlert } from "@/lib/support/ivr/alerts";
import {
  runAppointmentUseCase,
  runAttendanceUseCase,
  runOrderStatusUseCase,
  runPaymentUseCase,
  runTicketUseCase,
  surveyLabel,
} from "@/lib/support/ivr/use-cases";

export type ProcessIvrInput = {
  phone: string;
  fullName?: string;
  languageKey?: string;
  departmentKey?: string;
  /** Secondary DTMF after department (use-case / severity) */
  useCaseKey?: string;
  useCase?: IvrUseCase;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  agentAvailable?: boolean;
  voicemail?: string;
  durationSec?: number;
  holdSec?: number;
  orderDigits?: string;
  surveyScore?: number;
  preferredAt?: string;
  recordingUrl?: string;
  providerCallSid?: string;
  dtmfPath?: string;
  /** Simulate hangup after connect for survey */
  collectSurvey?: boolean;
};

async function logEvent(
  callId: string,
  type: string,
  opts?: { digit?: string; promptKey?: string; detail?: string }
) {
  await prisma.callEvent.create({
    data: {
      callId,
      type,
      digit: opts?.digit,
      promptKey: opts?.promptKey,
      detail: opts?.detail,
    },
  });
}

/**
 * Core IVR call processor — simulator + VOIP webhooks share this path.
 * Recorded voice only; CRM + ticket + callback on miss/voicemail.
 */
export async function processIvrCall(input: ProcessIvrInput) {
  const gateway = await getIvrGateway();
  const sessionUser = await getSessionUser();
  const language = languageFromKey(input.languageKey);
  const department = departmentFromKey(input.departmentKey);
  const available = input.agentAvailable ?? false;
  const phone = input.phone.trim();
  const digits = normalizePhone(phone);

  let useCase: IvrUseCase =
    input.useCase ||
    (department === "VOICEMAIL" || input.departmentKey === "9" ? "VOICEMAIL" : "ROUTE");
  let severity = input.severity;

  // Resolve secondary menu DTMF
  if (input.useCaseKey && !input.useCase) {
    if (department === "EXISTING") {
      const map: Record<string, IvrUseCase> = {
        "1": "ORDER_STATUS",
        "2": "PAYMENT",
        "3": "APPOINTMENT",
        "4": "TICKET",
        "0": "ROUTE",
      };
      useCase = map[input.useCaseKey] || "ROUTE";
    } else if (department === "TECHNICAL") {
      const sevMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
        "1": "LOW",
        "2": "MEDIUM",
        "3": "HIGH",
        "4": "CRITICAL",
      };
      severity = sevMap[input.useCaseKey] || "MEDIUM";
      useCase = "SEVERITY";
    } else if (department === "CARE") {
      const map: Record<string, IvrUseCase> = {
        "1": "ATTENDANCE",
        "2": "TICKET",
        "3": "SURVEY",
        "0": "ROUTE",
      };
      useCase = map[input.useCaseKey] || "ROUTE";
    }
  }

  let status = "ANSWERED";
  let queueStatus: string | null = null;
  let disposition: string | null = null;

  if (useCase === "VOICEMAIL" || input.departmentKey === "9") {
    status = "VOICEMAIL";
    disposition = "VOICEMAIL";
  } else if (
    useCase === "ATTENDANCE" ||
    useCase === "ORDER_STATUS" ||
    useCase === "PAYMENT" ||
    useCase === "APPOINTMENT" ||
    useCase === "TICKET" ||
    useCase === "SURVEY"
  ) {
    status = "COMPLETED";
    disposition = "SELF_SERVICE";
  } else if (!available) {
    status = input.voicemail ? "VOICEMAIL" : "MISSED";
    disposition = "CALLBACK_QUEUED";
    queueStatus = "IDLE";
  } else {
    status = "ANSWERED";
    disposition = "CONNECTED";
    queueStatus = "CONNECTED";
  }

  const dtmfPath =
    input.dtmfPath ||
    [input.languageKey, input.departmentKey, input.useCaseKey].filter(Boolean).join("-");

  const call = await prisma.callRecord.create({
    data: {
      callNumber: nextNumber("CALL"),
      userId: sessionUser?.id,
      phone,
      language,
      department,
      status,
      durationSec:
        input.durationSec ??
        (available ? 120 : useCase === "VOICEMAIL" ? 45 : status === "COMPLETED" ? 60 : 0),
      holdSec: input.holdSec ?? (available ? 15 : 0),
      notes: input.voicemail || input.fullName || undefined,
      disposition,
      agentName: available ? "On-duty agent" : null,
      useCase,
      queueStatus,
      severity: severity || null,
      dtmfPath,
      provider: gateway.provider,
      providerCallSid: input.providerCallSid || null,
      recordingUrl: input.recordingUrl || null,
      surveyScore: input.surveyScore ?? null,
      metaJson: JSON.stringify({ digits, holdMusic: gateway.holdMusicUrl }),
    },
  });

  await logEvent(call.id, "RING", { promptKey: "prompt.welcome" });
  await logEvent(call.id, "LANG", {
    digit: input.languageKey || "3",
    promptKey: `lang.${language}`,
  });
  await logEvent(call.id, "DTMF", {
    digit: input.departmentKey || "8",
    promptKey: `dept.${department.toLowerCase()}`,
    detail: `Department ${department}`,
  });
  if (input.useCaseKey) {
    await logEvent(call.id, "USE_CASE", {
      digit: input.useCaseKey,
      detail: useCase,
    });
  }

  // —— Use-case handlers ——
  let useCaseResult: Awaited<ReturnType<typeof runAttendanceUseCase>> | null = null;
  let ticketNumber: string | null = null;

  if (useCase === "ATTENDANCE") {
    useCaseResult = await runAttendanceUseCase(phone);
    await logEvent(call.id, "USE_CASE", {
      detail: useCaseResult.message,
      promptKey: useCaseResult.promptKey,
    });
  } else if (useCase === "ORDER_STATUS") {
    useCaseResult = await runOrderStatusUseCase({
      phone,
      orderDigits: input.orderDigits,
    });
  } else if (useCase === "PAYMENT") {
    useCaseResult = await runPaymentUseCase(phone);
  } else if (useCase === "APPOINTMENT") {
    useCaseResult = await runAppointmentUseCase({
      phone,
      fullName: input.fullName,
      userId: sessionUser?.id,
      preferredAt: input.preferredAt,
    });
  } else if (useCase === "TICKET" || useCase === "SEVERITY") {
    useCaseResult = await runTicketUseCase({
      phone,
      fullName: input.fullName,
      department,
      body: input.voicemail,
      severity,
      userId: sessionUser?.id,
    });
    ticketNumber = (useCaseResult.data?.ticketNumber as string) || null;
    await prisma.callRecord.update({
      where: { id: call.id },
      data: {
        ticketId: (useCaseResult.data?.ticketId as string) || null,
        status: useCase === "SEVERITY" && available ? "ANSWERED" : "COMPLETED",
        queueStatus: useCase === "SEVERITY" && available ? "QUEUED" : queueStatus,
        disposition: useCase === "SEVERITY" ? `SEVERITY_${severity}` : disposition,
      },
    });
    if (useCase === "SEVERITY" && available) {
      await logEvent(call.id, "HOLD", { promptKey: "prompt.hold_music" });
      await logEvent(call.id, "TRANSFER", { detail: `Severity ${severity} → agent queue` });
    }
  } else if (useCase === "SURVEY" && input.surveyScore != null) {
    const score = Math.min(5, Math.max(1, input.surveyScore));
    await prisma.callRecord.update({
      where: { id: call.id },
      data: { surveyScore: score, disposition: `CSAT_${score}` },
    });
    await logEvent(call.id, "SURVEY", {
      digit: String(score),
      promptKey: "prompt.survey_1_to_5",
      detail: surveyLabel(score),
    });
    useCaseResult = {
      ok: true,
      useCase: "SURVEY",
      message: `Thanks — rating ${score}/5 (${surveyLabel(score)}).`,
      promptKey: "prompt.survey_1_to_5",
      data: { score },
    };
  }

  // Agent connect + optional post-call survey
  if (available && (useCase === "ROUTE" || useCase === "SEVERITY")) {
    await logEvent(call.id, "HOLD", {
      promptKey: "prompt.hold_music",
      detail: `Hold ${input.holdSec ?? 15}s`,
    });
    await logEvent(call.id, "TRANSFER", {
      promptKey: "prompt.transfer",
      detail: (gateway.agentNumbers ?? [])[0] || "On-duty agent",
    });
    await logEvent(call.id, "ANSWER", { detail: "Connected to live agent" });
    if (input.collectSurvey && input.surveyScore != null) {
      await logEvent(call.id, "SURVEY", {
        digit: String(input.surveyScore),
        detail: surveyLabel(input.surveyScore),
      });
      await prisma.callRecord.update({
        where: { id: call.id },
        data: { surveyScore: input.surveyScore, status: "COMPLETED", queueStatus: "COMPLETED" },
      });
    }
  }

  if (input.recordingUrl || status === "VOICEMAIL") {
    await logEvent(call.id, "RECORD", {
      promptKey: "prompt.voicemail_beep",
      detail: input.recordingUrl || "voicemail captured (text/simulator)",
    });
  }

  const { ensureLeadFromChannel } = await import("@/lib/crm/channels");
  const lead = await ensureLeadFromChannel({
    channel: "IVR",
    fullName: input.fullName || `Caller ${phone}`,
    email: sessionUser?.email,
    phone,
    interest: `IVR ${department}${useCase !== "ROUTE" ? ` · ${useCase}` : ""}`,
    activityType: "IVR",
    activityBody: `Call ${call.callNumber} · ${status} · ${department} · ${useCase} · lang ${language}`,
    channelRef: call.id,
    userId: sessionUser?.id,
  });

  await prisma.callRecord.update({
    where: { id: call.id },
    data: { leadId: lead.id },
  });

  // Miss / voicemail → ticket + callback + WhatsApp alert
  if (status === "MISSED" || status === "VOICEMAIL") {
    if (!ticketNumber) {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber("TKT"),
          userId: sessionUser?.id,
          guestName: input.fullName || `Caller ${phone}`,
          subject: `IVR ${status}: ${department}`,
          department:
            department === "CARE" || department === "VOICEMAIL" || department === "EXISTING"
              ? "GENERAL"
              : department === "SALES"
                ? "SALES"
                : department === "BILLING"
                  ? "BILLING"
                  : "TECHNICAL",
          priority: "HIGH",
          channel: "IVR",
          status: "OPEN",
          messages: {
            create: {
              authorName: input.fullName || phone,
              authorRole: "CUSTOMER",
              body:
                input.voicemail ||
                `Missed call — language ${language}, department ${department}. Callback queued.`,
            },
          },
        },
      });
      ticketNumber = ticket.ticketNumber;
      await prisma.callRecord.update({
        where: { id: call.id },
        data: { ticketId: ticket.id },
      });
    }

    await prisma.callbackRequest.create({
      data: {
        userId: sessionUser?.id,
        fullName: input.fullName || `Caller ${phone}`,
        phone,
        reason:
          department === "SALES" ? "SALES" : department === "BILLING" ? "BILLING" : "SUPPORT",
        notes: `From IVR call ${call.callNumber}`,
        status: "PENDING",
      },
    });

    if (sessionUser) {
      await notifyUser({
        userId: sessionUser.id,
        title: `Callback queued · ${call.callNumber}`,
        body: "We missed your call — support will call you back.",
        category: "SUPPORT",
      });
    }

    await sendMissedCallAlert({
      callId: call.id,
      phone,
      callNumber: call.callNumber,
      department,
      status,
      ticketNumber,
    });
  }

  void writeAuditLog({
    actorId: sessionUser?.id,
    actorEmail: sessionUser?.email,
    actorName: sessionUser?.fullName || input.fullName,
    action: "CREATE",
    module: "IVR",
    entityType: "CallRecord",
    entityId: call.id,
    summary: `IVR ${call.callNumber} ${status} · ${department} · ${useCase}`,
  });

  const fresh = await prisma.callRecord.findUnique({
    where: { id: call.id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  return {
    call: fresh,
    ticketNumber,
    useCase,
    useCaseResult,
    leadId: lead.id,
    menu: menuSnapshot(),
    gateway: { provider: gateway.provider, active: gateway.active },
    message:
      useCaseResult?.message ||
      (status === "ANSWERED"
        ? "Connected to agent. Professional recorded IVR — no AI voice."
        : status === "COMPLETED"
          ? "Self-service IVR flow completed."
          : "No agent available — voicemail/ticket + callback created in CRM. Missed-call alert sent."),
  };
}

/** Agent takes next queued call */
export async function claimQueuedCall(opts: {
  callId: string;
  agentName: string;
  agentUserId?: string;
}) {
  const call = await prisma.callRecord.update({
    where: { id: opts.callId },
    data: {
      status: "ANSWERED",
      queueStatus: "CONNECTED",
      disposition: "CONNECTED",
      agentName: opts.agentName,
    },
  });
  await logEvent(call.id, "TRANSFER", { detail: `Claimed by ${opts.agentName}` });
  await logEvent(call.id, "ANSWER", { detail: "Agent connected" });
  return call;
}

export async function completeCall(opts: {
  callId: string;
  surveyScore?: number;
  notes?: string;
  recordingUrl?: string;
  durationSec?: number;
}) {
  const call = await prisma.callRecord.update({
    where: { id: opts.callId },
    data: {
      status: "COMPLETED",
      queueStatus: "COMPLETED",
      surveyScore: opts.surveyScore,
      notes: opts.notes,
      recordingUrl: opts.recordingUrl,
      durationSec: opts.durationSec,
    },
  });
  if (opts.surveyScore != null) {
    await logEvent(call.id, "SURVEY", {
      digit: String(opts.surveyScore),
      detail: surveyLabel(opts.surveyScore),
    });
  }
  await logEvent(call.id, "HANGUP");
  return call;
}
