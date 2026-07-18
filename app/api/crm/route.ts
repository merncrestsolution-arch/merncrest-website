import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { z } from "zod";

export async function GET() {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const [leads, activities, stats] = await Promise.all([
      prisma.crmLead.findMany({
        include: {
          owner: { select: { fullName: true, email: true } },
          activities: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.crmActivity.findMany({
        include: { lead: { select: { fullName: true, company: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.crmLead.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      leads,
      activities,
      pipeline: Object.fromEntries(stats.map((s) => [s.stage, s._count._all])),
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
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  notes: z.string().optional(),
  valueCents: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }

    const lead = await prisma.crmLead.create({
      data: {
        ...parsed.data,
        stage: parsed.data.stage ?? "NEW",
        source: parsed.data.source ?? "MANUAL",
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
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).optional(),
  notes: z.string().optional(),
  valueCents: z.number().int().min(0).optional(),
  activity: z
    .object({
      type: z.enum(["NOTE", "CALL", "EMAIL", "WHATSAPP", "MEETING", "STATUS"]),
      body: z.string().min(1),
    })
    .optional(),
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
        },
        include: {
          activities: { orderBy: { createdAt: "desc" }, take: 10 },
          owner: { select: { fullName: true } },
        },
      });
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[crm:patch]", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
