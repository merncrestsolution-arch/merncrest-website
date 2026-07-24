import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { menuSnapshot } from "@/lib/support/ivr/menu";
import {
  claimQueuedCall,
  completeCall,
  processIvrCall,
} from "@/lib/support/ivr/process";
import { getIvrAnalytics } from "@/lib/support/ivr/analytics";
import { writeAuditLog } from "@/lib/erp/audit";

const postSchema = z.object({
  phone: z.string().min(8),
  fullName: z.string().optional(),
  languageKey: z.enum(["1", "2", "3"]).optional(),
  departmentKey: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9"]).optional(),
  useCaseKey: z.enum(["0", "1", "2", "3", "4"]).optional(),
  useCase: z
    .enum([
      "ROUTE",
      "ATTENDANCE",
      "TICKET",
      "ORDER_STATUS",
      "PAYMENT",
      "SEVERITY",
      "APPOINTMENT",
      "SURVEY",
      "VOICEMAIL",
    ])
    .optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  agentAvailable: z.boolean().optional(),
  voicemail: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
  holdSec: z.number().int().min(0).optional(),
  orderDigits: z.string().optional(),
  surveyScore: z.number().int().min(1).max(5).optional(),
  preferredAt: z.string().optional(),
  recordingUrl: z.string().optional(),
  providerCallSid: z.string().optional(),
  dtmfPath: z.string().optional(),
  collectSurvey: z.boolean().optional(),
});

/** Simulate IVR call flow / accept structured telephony payloads */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid IVR payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const result = await processIvrCall({
      ...data,
      recordingUrl: data.recordingUrl || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ivr]", error);
    return NextResponse.json({ error: "IVR failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "menu") {
    return NextResponse.json({ menu: menuSnapshot() });
  }

  if (view === "analytics") {
    const days = Number(searchParams.get("days") || 30);
    const analytics = await getIvrAnalytics(Number.isFinite(days) ? days : 30);
    return NextResponse.json({ analytics });
  }

  if (view === "queue") {
    const queue = await prisma.callRecord.findMany({
      where: {
        OR: [
          { queueStatus: { in: ["QUEUED", "HOLD"] } },
          { status: { in: ["MISSED", "VOICEMAIL", "CALLBACK"] }, disposition: "CALLBACK_QUEUED" },
        ],
      },
      orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
      take: 50,
      include: { events: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return NextResponse.json({ queue });
  }

  const calls = await prisma.callRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { events: { orderBy: { createdAt: "asc" }, take: 20 } },
  });
  return NextResponse.json({ calls, menu: menuSnapshot() });
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["claim", "complete", "update"]).optional(),
  status: z
    .enum(["RINGING", "ANSWERED", "MISSED", "VOICEMAIL", "CALLBACK", "QUEUED", "HOLD", "COMPLETED"])
    .optional(),
  notes: z.string().optional(),
  disposition: z.string().optional(),
  agentName: z.string().optional(),
  surveyScore: z.number().int().min(1).max(5).optional(),
  recordingUrl: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
  queueStatus: z.enum(["IDLE", "QUEUED", "HOLD", "CONNECTED", "COMPLETED"]).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const action = parsed.data.action || "update";

  if (action === "claim") {
    const call = await claimQueuedCall({
      callId: parsed.data.id,
      agentName: parsed.data.agentName || auth.user.fullName,
      agentUserId: auth.user.id,
    });
    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "IVR",
      entityType: "CallRecord",
      entityId: call.id,
      summary: `Claimed call ${call.callNumber}`,
    });
    return NextResponse.json({ call });
  }

  if (action === "complete") {
    const call = await completeCall({
      callId: parsed.data.id,
      surveyScore: parsed.data.surveyScore,
      notes: parsed.data.notes,
      recordingUrl: parsed.data.recordingUrl,
      durationSec: parsed.data.durationSec,
    });
    return NextResponse.json({ call });
  }

  const call = await prisma.callRecord.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      disposition: parsed.data.disposition,
      agentName: parsed.data.agentName ?? auth.user.fullName,
      surveyScore: parsed.data.surveyScore,
      recordingUrl: parsed.data.recordingUrl,
      durationSec: parsed.data.durationSec,
      queueStatus: parsed.data.queueStatus,
    },
  });
  return NextResponse.json({ call });
}
