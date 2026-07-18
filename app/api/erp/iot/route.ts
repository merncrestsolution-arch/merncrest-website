import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { requirePermission } from "@/lib/erp/permissions";
import { z } from "zod";

export async function GET() {
  const auth = await requirePermission(["erp.iot.view", "erp.iot.manage"]);
  if (auth.error) return auth.error;

  const devices = await prisma.iotDevice.findMany({
    include: { readings: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ devices });
}

export async function POST(request: Request) {
  const auth = await requirePermission("erp.iot.manage");
  if (auth.error) return auth.error;

  const body = await request.json();
  if (body.action === "reading") {
    const schema = z.object({
      deviceId: z.string(),
      metric: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const reading = await prisma.iotReading.create({ data: parsed.data });
    const healthScore = Math.max(0, Math.min(100, 100 - Math.abs(parsed.data.value - 50) / 2));
    await prisma.iotDevice.update({
      where: { id: parsed.data.deviceId },
      data: {
        lastSeenAt: new Date(),
        status: healthScore < 40 ? "ALERT" : "ONLINE",
        healthScore: Math.round(healthScore),
      },
    });
    return NextResponse.json({ reading }, { status: 201 });
  }

  const schema = z.object({
    name: z.string().min(2),
    location: z.string().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const device = await prisma.iotDevice.create({
    data: {
      deviceCode: nextNumber("IOT"),
      name: parsed.data.name,
      location: parsed.data.location,
      lastSeenAt: new Date(),
    },
  });
  return NextResponse.json({ device }, { status: 201 });
}
