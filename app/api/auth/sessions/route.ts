import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, hashToken } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  const current = await prisma.session.findFirst({
    where: currentHash ? { tokenHash: currentHash } : { id: "__none__" },
    select: { id: true },
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      ...s,
      current: s.id === current?.id,
    })),
  });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const all = Boolean((body as { all?: boolean }).all);
  const sessionId = (body as { sessionId?: string }).sessionId;

  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  if (all) {
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        ...(currentHash ? { NOT: { tokenHash: currentHash } } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId or all required" }, { status: 400 });
  }

  await prisma.session.deleteMany({
    where: { id: sessionId, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
