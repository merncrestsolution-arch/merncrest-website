import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { getSessionUser } from "@/lib/auth";
import { notifyUser } from "@/lib/support/notify";
import { z } from "zod";

const LANG: Record<string, string> = { "1": "si", "2": "ta", "3": "en" };
const DEPT: Record<string, string> = {
  "1": "SALES",
  "2": "TECHNICAL",
  "3": "HOSTING",
  "4": "DOMAIN",
  "5": "BILLING",
  "6": "ENTERPRISE",
  "7": "CARE",
};

/** Simulate IVR call flow / log real telephony webhooks later */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schema = z.object({
      phone: z.string().min(8),
      fullName: z.string().optional(),
      languageKey: z.enum(["1", "2", "3"]).optional(),
      departmentKey: z.enum(["1", "2", "3", "4", "5", "6", "7"]).optional(),
      agentAvailable: z.boolean().optional(),
      voicemail: z.string().optional(),
      durationSec: z.number().int().min(0).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid IVR payload" }, { status: 400 });
    }

    const language = LANG[parsed.data.languageKey || "3"];
    const department = DEPT[parsed.data.departmentKey || "7"];
    const available = parsed.data.agentAvailable ?? false;
    const sessionUser = await getSessionUser();

    let status = "ANSWERED";
    if (!available && parsed.data.voicemail) status = "VOICEMAIL";
    else if (!available) status = "MISSED";

    const call = await prisma.callRecord.create({
      data: {
        callNumber: nextNumber("CALL"),
        userId: sessionUser?.id,
        phone: parsed.data.phone,
        language,
        department,
        status,
        durationSec: parsed.data.durationSec ?? (available ? 120 : 0),
        notes: parsed.data.voicemail || parsed.data.fullName || undefined,
        disposition: available ? "CONNECTED" : "CALLBACK_QUEUED",
        agentName: available ? "On-duty agent" : null,
      },
    });

    let ticketNumber: string | null = null;
    if (status === "MISSED" || status === "VOICEMAIL") {
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber: nextNumber("TKT"),
          userId: sessionUser?.id,
          guestName: parsed.data.fullName || `Caller ${parsed.data.phone}`,
          subject: `IVR ${status}: ${department}`,
          department: department === "CARE" ? "GENERAL" : department === "SALES" ? "SALES" : "TECHNICAL",
          priority: "HIGH",
          channel: "IVR",
          status: "OPEN",
          messages: {
            create: {
              authorName: parsed.data.fullName || parsed.data.phone,
              authorRole: "CUSTOMER",
              body:
                parsed.data.voicemail ||
                `Missed call — language ${language}, department ${department}. Callback queued.`,
            },
          },
        },
      });
      ticketNumber = ticket.ticketNumber;

      await prisma.callbackRequest.create({
        data: {
          userId: sessionUser?.id,
          fullName: parsed.data.fullName || `Caller ${parsed.data.phone}`,
          phone: parsed.data.phone,
          reason: department === "SALES" ? "SALES" : department === "BILLING" ? "BILLING" : "SUPPORT",
          notes: `From IVR call ${call.callNumber}`,
          status: "PENDING",
        },
      });

      await prisma.crmLead.create({
        data: {
          fullName: parsed.data.fullName || `Caller ${parsed.data.phone}`,
          email: sessionUser?.email || `${parsed.data.phone.replace(/\D/g, "")}@ivr.local`,
          phone: parsed.data.phone,
          interest: `IVR ${department}`,
          source: "IVR",
          stage: "NEW",
          priority: "HIGH",
          activities: {
            create: { type: "CALL", body: `Call ${call.callNumber} · ${status}` },
          },
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
    }

    return NextResponse.json({
      call,
      ticketNumber,
      menu: {
        language: { "1": "Sinhala", "2": "Tamil", "3": "English" },
        department: {
          "1": "Sales",
          "2": "Technical Support",
          "3": "Hosting",
          "4": "Domain Services",
          "5": "Billing",
          "6": "Enterprise Solutions",
          "7": "Customer Care",
        },
      },
      message:
        status === "ANSWERED"
          ? "Connected to agent (simulated)."
          : "No agent available — voicemail/ticket + callback created.",
    });
  } catch (error) {
    console.error("[ivr]", error);
    return NextResponse.json({ error: "IVR failed" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const calls = await prisma.callRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ calls });
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["RINGING", "ANSWERED", "MISSED", "VOICEMAIL", "CALLBACK"]).optional(),
  notes: z.string().optional(),
  disposition: z.string().optional(),
  agentName: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const call = await prisma.callRecord.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      disposition: parsed.data.disposition,
      agentName: parsed.data.agentName ?? auth.user.fullName,
    },
  });
  return NextResponse.json({ call });
}
