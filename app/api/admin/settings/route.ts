import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getSettingsByGroup, setSetting, ensureDefaultSettings } from "@/lib/admin/settings";
import { writeAuditLog } from "@/lib/erp/audit";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const group = new URL(request.url).searchParams.get("group") || undefined;
  await ensureDefaultSettings();
  const settings = await getSettingsByGroup(group);

  const groups = Array.from(new Set(settings.map((s) => s.group)));
  return NextResponse.json({ settings, groups });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const schema = z.object({
    updates: z.array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      })
    ),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
  }

  const saved = [];
  for (const u of parsed.data.updates) {
    saved.push(await setSetting(u.key, u.value, auth.user.id));
  }

  await writeAuditLog({
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    actorName: auth.user.fullName,
    action: "SETTINGS",
    module: "ADMIN",
    summary: `Updated ${saved.length} system setting(s)`,
    meta: { keys: parsed.data.updates.map((u) => u.key) },
  });

  return NextResponse.json({ settings: saved });
}
