import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/support/notify";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { z } from "zod";

/**
 * PUBLIC job application endpoint. Writes to JobApplication and notifies
 * admins/owners (HR). Replaces the previous formsubmit.co email flow.
 */
const schema = z.object({
  jobOpeningId: z.string().min(1),
  fullName: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  coverLetter: z.string().max(5000).optional().or(z.literal("")),
  resumeUrl: z.string().url().max(500).optional().or(z.literal("")),
});

const hits = new Map<string, { count: number; ts: number }>();
function throttled(key: string) {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.ts > 60_000) {
    hits.set(key, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > 5;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anon";
    if (throttled(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const raw = await request.json().catch(() => null);

    const captcha = await verifyTurnstile(
      (raw as { turnstileToken?: string } | null)?.turnstileToken,
      ip
    );
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid application" },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const opening = await prisma.jobOpening.findUnique({ where: { id: d.jobOpeningId } });
    if (!opening || opening.status !== "OPEN") {
      return NextResponse.json({ error: "This position is no longer open." }, { status: 404 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobOpeningId: opening.id,
        fullName: d.fullName,
        email: d.email.toLowerCase().trim(),
        phone: d.phone || null,
        coverLetter: d.coverLetter || null,
        resumeUrl: d.resumeUrl || null,
        source: "careers-page",
        status: "NEW",
      },
    });

    // Notify HR (admins/owners) about the new application.
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: { id: true },
      take: 20,
    });
    await Promise.all(
      admins.map((a) =>
        notifyUser({
          userId: a.id,
          title: "New job application",
          body: `${d.fullName} applied for ${opening.title}`,
          category: "HR",
          href: "/admin/erp/hr",
        })
      )
    );

    return NextResponse.json(
      {
        ok: true,
        applicationId: application.id,
        message: "Application received — our team will be in touch.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[careers:apply]", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }
}
