import { NextResponse } from "next/server";
import { z } from "zod";
import { TemplateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { getPrimaryOrganizationId } from "@/lib/chat/org";
import { routeAiChat } from "@/lib/ai/ai-router";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const approvedOnly = url.searchParams.get("approved") === "1";
  const organizationId = await getPrimaryOrganizationId();

  const templates = await prisma.messageTemplate.findMany({
    where: {
      organizationId,
      ...(approvedOnly ? { status: TemplateStatus.APPROVED } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(40).optional(),
  content: z.string().min(1).max(8000).optional(),
  status: z.enum(["DRAFT", "APPROVED"]).optional(),
  delete: z.boolean().optional(),
  generate: z.boolean().optional(),
  count: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const organizationId = await getPrimaryOrganizationId();
  const admin = isAdminRole(auth.user.role);

  if (parsed.data.generate) {
    if (!admin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const category = parsed.data.category || "follow-up";
    const count = parsed.data.count || 3;
    const assistant = await prisma.aiAssistantConfig.findUnique({
      where: { organizationId },
    });
    let drafts: { title: string; content: string }[] = [];
    try {
      const result = await routeAiChat({
        organizationId,
        systemPrompt: `${assistant?.systemPrompt || "You write concise professional client messages for MernCrest."}\nReturn ONLY JSON array of ${count} objects: {"title","content"} for category "${category}".`,
        messages: [
          {
            role: "user",
            content: `Generate ${count} ${category} message templates for Sri Lanka enterprise clients.`,
          },
        ],
        maxTokens: 1200,
      });
      const match = result.content.match(/\[[\s\S]*\]/);
      if (match) drafts = JSON.parse(match[0]);
    } catch {
      drafts = [
        {
          title: `${category} — intro`,
          content:
            "Hi {{name}}, thanks for connecting with MernCrest. Happy to help with your project — when works for a short call?",
        },
      ];
    }

    const created = await Promise.all(
      drafts.slice(0, count).map((d) =>
        prisma.messageTemplate.create({
          data: {
            organizationId,
            title: String(d.title || "Draft").slice(0, 120),
            category,
            content: String(d.content || "").slice(0, 8000),
            generatedByAi: true,
            status: TemplateStatus.DRAFT,
            createdBy: auth.user.id,
          },
        })
      )
    );
    return NextResponse.json({ templates: created });
  }

  if (parsed.data.delete && parsed.data.id) {
    if (!admin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    await prisma.messageTemplate.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.id) {
    if (!admin && parsed.data.status === "APPROVED") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const updated = await prisma.messageTemplate.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        content: parsed.data.content,
        status: parsed.data.status as TemplateStatus | undefined,
      },
    });
    return NextResponse.json({ template: updated });
  }

  if (!admin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  if (!parsed.data.title || !parsed.data.content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const created = await prisma.messageTemplate.create({
    data: {
      organizationId,
      title: parsed.data.title,
      category: parsed.data.category || "follow-up",
      content: parsed.data.content,
      generatedByAi: false,
      status: TemplateStatus.DRAFT,
      createdBy: auth.user.id,
    },
  });
  return NextResponse.json({ template: created });
}
