import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearSessionCookie,
  destroySession,
  getSessionUser,
  SESSION_COOKIE,
} from "@/lib/auth";
import { setAgentOfflineOnLogout } from "@/lib/chat/presence";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      await setAgentOfflineOnLogout(user.id).catch(() => undefined);
    }
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      await destroySession(token);
    }
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[logout]", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
