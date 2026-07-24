import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";

function dmChannel(a: string, b: string) {
  return `dm:${[a, b].sort().join(":")}`;
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const peerId = url.searchParams.get("peerId");
  const channel = peerId ? dmChannel(auth.user.id, peerId) : url.searchParams.get("channel") || "general";

  const messages = await prisma.internalMessage.findMany({
    where: {
      OR: [
        { channel },
        ...(peerId
          ? [
              { senderId: auth.user.id, recipientId: peerId },
              { senderId: peerId, recipientId: auth.user.id },
            ]
          : []),
      ],
    },
    include: {
      sender: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN", "OWNER"] } },
    select: { id: true, fullName: true, email: true },
    take: 80,
  });

  return NextResponse.json({ messages, channel, staff });
}

const postSchema = z.object({
  body: z.string().min(1).max(4000),
  channel: z.string().optional(),
  recipientId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const channel = parsed.data.recipientId
    ? dmChannel(auth.user.id, parsed.data.recipientId)
    : parsed.data.channel || "general";

  const message = await prisma.internalMessage.create({
    data: {
      senderId: auth.user.id,
      recipientId: parsed.data.recipientId || null,
      channel,
      threadId: channel,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, fullName: true } } },
  });

  return NextResponse.json({ message }, { status: 201 });
}
