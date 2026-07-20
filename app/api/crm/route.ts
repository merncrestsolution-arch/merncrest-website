import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber, requireStaff } from "@/lib/commerce";
import { CRM_STAGES, computeLeadScore } from "@/lib/crm/stages";
import { z } from "zod";

const stageEnum = z.enum(CRM_STAGES);

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const now = new Date();
    const [leads, activities, stats, overdueFollowUps, upcomingMeetings] =
      await Promise.all([
        prisma.crmLead.findMany({
          include: {
            owner: { select: { id: true, fullName: true, email: true } },
            activities: { orderBy: { createdAt: "desc" }, take: 5 },
            followUps: {
              where: { status: { in: ["PENDING", "OVERDUE"] } },
              orderBy: { dueAt: "asc" },
              take: 3,
            },
            meetings: {
              where: { status: "SCHEDULED", scheduledAt: { gte: now } },
              orderBy: { scheduledAt: "asc" },
              take: 2,
            },
            quotations: { orderBy: { createdAt: "desc" }, take: 2 },
          },
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        prisma.crmActivity.findMany({
          include: { lead: { select: { fullName: true, company: true, leadNumber: true } } },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        prisma.crmLead.groupBy({
          by: ["stage"],
          _count: { _all: true },
        }),
        prisma.crmFollowUp.findMany({
          where: {
            status: "PENDING",
            dueAt: { lt: now },
          },
          include: { lead: { select: { fullName: true, leadNumber: true } } },
          orderBy: { dueAt: "asc" },
          take: 20,
        }),
        prisma.crmMeeting.findMany({
          where: { status: "SCHEDULED", scheduledAt: { gte: now } },
          include: { lead: { select: { fullName: true, leadNumber: true } } },
          orderBy: { scheduledAt: "asc" },
          take: 15,
        }),
      ]);

    // Mark overdue follow-ups
    if (overdueFollowUps.length) {
      await prisma.crmFollowUp.updateMany({
        where: {
          id: { in: overdueFollowUps.map((f) => f.id) },
          status: "PENDING",
        },
        data: { status: "OVERDUE" },
      });
    }

    const won = leads.filter((l) => l.stage === "WON").length;
    const total = leads.length || 1;

    return NextResponse.json({
      leads,
      activities,
      pipeline: Object.fromEntries(stats.map((s) => [s.stage, s._count._all])),
      stages: CRM_STAGES,
      kpis: {
        totalLeads: leads.length,
        won,
        conversionRate: Math.round((won / total) * 100),
        overdueFollowUps: overdueFollowUps.length,
        upcomingMeetings: upcomingMeetings.length,
        avgLeadScore: Math.round(
          leads.reduce((s, l) => s + l.leadScore, 0) / total
        ),
      },
      overdueFollowUps,
      upcomingMeetings,
    });
  } catch (error) {
    console.error("[crm:get]", error);
    return NextResponse.json({ error: "Failed to load CRM" }, { status: 500 });
  }
}

const leadSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  interest: z.string().optional(),
  source: z.string().optional(),
  stage: stageEnum.optional(),
  notes: z.string().optional(),
  valueCents: z.number().int().min(0).optional(),
  budgetCents: z.number().int().min(0).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  timeline: z.string().optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    // Follow-up creation
    if (body.action === "followup") {
      const schema = z.object({
        leadId: z.string(),
        type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "DEMO", "REMINDER", "ESCALATION"]),
        title: z.string().min(2),
        notes: z.string().optional(),
        dueAt: z.string(),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid follow-up" }, { status: 400 });
      }
      const followUp = await prisma.crmFollowUp.create({
        data: {
          leadId: parsed.data.leadId,
          assigneeId: auth.user.id,
          type: parsed.data.type,
          title: parsed.data.title,
          notes: parsed.data.notes,
          dueAt: new Date(parsed.data.dueAt),
          status: "PENDING",
        },
      });
      await prisma.crmActivity.create({
        data: {
          leadId: parsed.data.leadId,
          userId: auth.user.id,
          type: "NOTE",
          body: `Follow-up scheduled: ${parsed.data.title} (${parsed.data.type})`,
        },
      });
      return NextResponse.json({ followUp }, { status: 201 });
    }

    // Meeting booking
    if (body.action === "meeting") {
      const schema = z.object({
        leadId: z.string().optional(),
        meetingType: z
          .enum(["CONSULTATION", "ONLINE", "OFFICE", "TECHNICAL", "SALES"])
          .optional(),
        title: z.string().min(2),
        location: z.string().optional(),
        scheduledAt: z.string(),
        durationMin: z.number().int().optional(),
        notes: z.string().optional(),
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid meeting" }, { status: 400 });
      }
      const meeting = await prisma.crmMeeting.create({
        data: {
          leadId: parsed.data.leadId,
          userId: auth.user.id,
          meetingType: parsed.data.meetingType || "CONSULTATION",
          title: parsed.data.title,
          location: parsed.data.location,
          scheduledAt: new Date(parsed.data.scheduledAt),
          durationMin: parsed.data.durationMin || 30,
          notes: parsed.data.notes,
          status: "SCHEDULED",
        },
      });
      if (parsed.data.leadId) {
        await prisma.crmLead.update({
          where: { id: parsed.data.leadId },
          data: { stage: "MEETING" },
        });
        await prisma.crmActivity.create({
          data: {
            leadId: parsed.data.leadId,
            userId: auth.user.id,
            type: "MEETING",
            body: `Meeting booked: ${parsed.data.title}`,
          },
        });
      }
      return NextResponse.json({ meeting }, { status: 201 });
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }

    const score =
      parsed.data.leadScore ??
      computeLeadScore({
        budgetCents: parsed.data.budgetCents,
        valueCents: parsed.data.valueCents,
        priority: parsed.data.priority,
        interest: parsed.data.interest,
        phone: parsed.data.phone,
        company: parsed.data.company,
      });

    const lead = await prisma.crmLead.create({
      data: {
        leadNumber: nextNumber("LEAD"),
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        company: parsed.data.company,
        interest: parsed.data.interest,
        source: parsed.data.source ?? "MANUAL",
        stage: parsed.data.stage ?? "NEW",
        notes: parsed.data.notes,
        valueCents: parsed.data.valueCents ?? 0,
        budgetCents: parsed.data.budgetCents ?? 0,
        priority: parsed.data.priority ?? "MEDIUM",
        timeline: parsed.data.timeline,
        leadScore: score,
        ownerId: auth.user.id,
        activities: {
          create: {
            userId: auth.user.id,
            type: "NOTE",
            body: `Lead created by ${auth.user.fullName}`,
          },
        },
      },
      include: { activities: true },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("[crm:post]", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

const patchSchema = z.object({
  leadId: z.string(),
  stage: stageEnum.optional(),
  notes: z.string().optional(),
  valueCents: z.number().int().min(0).optional(),
  budgetCents: z.number().int().min(0).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  timeline: z.string().optional(),
  interest: z.string().optional(),
  followUpAt: z.string().optional(),
  ownerId: z.string().optional().nullable(),
  activity: z
    .object({
      type: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP", "MEETING", "STATUS", "CHAT", "IVR", "FORM"]),
      body: z.string().min(1),
    })
    .optional(),
  completeFollowUpId: z.string().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const lead = await prisma.$transaction(async (tx) => {
      if (parsed.data.completeFollowUpId) {
        await tx.crmFollowUp.update({
          where: { id: parsed.data.completeFollowUpId },
          data: { status: "DONE", completedAt: new Date() },
        });
      }

      if (parsed.data.activity) {
        await tx.crmActivity.create({
          data: {
            leadId: parsed.data.leadId,
            userId: auth.user.id,
            type: parsed.data.activity.type,
            body: parsed.data.activity.body,
          },
        });
      }

      if (parsed.data.stage) {
        await tx.crmActivity.create({
          data: {
            leadId: parsed.data.leadId,
            userId: auth.user.id,
            type: "STATUS",
            body: `Stage → ${parsed.data.stage}`,
          },
        });
      }

      return tx.crmLead.update({
        where: { id: parsed.data.leadId },
        data: {
          stage: parsed.data.stage,
          notes: parsed.data.notes,
          valueCents: parsed.data.valueCents,
          budgetCents: parsed.data.budgetCents,
          priority: parsed.data.priority,
          leadScore: parsed.data.leadScore,
          timeline: parsed.data.timeline,
          interest: parsed.data.interest,
          ownerId: parsed.data.ownerId === undefined ? undefined : parsed.data.ownerId,
          followUpAt: parsed.data.followUpAt
            ? new Date(parsed.data.followUpAt)
            : undefined,
        },
        include: {
          activities: { orderBy: { createdAt: "desc" }, take: 10 },
          owner: { select: { fullName: true } },
          followUps: { orderBy: { dueAt: "asc" }, take: 5 },
          meetings: { orderBy: { scheduledAt: "asc" }, take: 5 },
        },
      });
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[crm:patch]", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
