import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/commerce";
import { isAdminRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/erp/audit";
import { parseLeadsSpreadsheet } from "@/lib/crm/spreadsheet-import";
import { importLeadRows } from "@/lib/crm/import-leads";

/**
 * POST { csv } — bulk import leads (CSV text)
 * POST { xlsxBase64, filename } — Excel .xlsx import
 * multipart file upload also supported
 * POST { action: "MERGE" | "FIND_DUPES" }
 */
export async function POST(request: Request) {
  const auth = await requireStaff();
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") || "";

  // Multipart: .xlsx / .csv file
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    let parsed;
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buf = await file.arrayBuffer();
      parsed = parseLeadsSpreadsheet(buf, name);
    } else {
      const text = await file.text();
      parsed = parseLeadsSpreadsheet(text, name);
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows", parseErrors: parsed.errors },
        { status: 400 }
      );
    }
    const result = await importLeadRows(parsed.rows, auth.user);
    return NextResponse.json(
      {
        created: result.created.length,
        skipped: result.skipped.length,
        leads: result.created,
        skippedRows: result.skipped.slice(0, 20),
        parseErrors: parsed.errors.slice(0, 20),
      },
      { status: 201 }
    );
  }

  const body = await request.json();

  if (body.action === "FIND_DUPES") {
    const leads = await prisma.crmLead.findMany({
      select: {
        id: true,
        leadNumber: true,
        email: true,
        phone: true,
        fullName: true,
        stage: true,
        company: true,
      },
      take: 500,
      orderBy: { createdAt: "desc" },
    });
    const byEmail = new Map<string, typeof leads>();
    const byPhone = new Map<string, typeof leads>();
    for (const l of leads) {
      const e = l.email.toLowerCase().trim();
      if (!byEmail.has(e)) byEmail.set(e, []);
      byEmail.get(e)!.push(l);
      const p = (l.phone || "").replace(/\D/g, "");
      if (p.length >= 9) {
        if (!byPhone.has(p)) byPhone.set(p, []);
        byPhone.get(p)!.push(l);
      }
    }
    const groups = [
      ...[...byEmail.entries()]
        .filter(([, g]) => g.length > 1)
        .map(([key, g]) => ({ key: `email:${key}`, leads: g })),
      ...[...byPhone.entries()]
        .filter(([, g]) => g.length > 1)
        .map(([key, g]) => ({ key: `phone:${key}`, leads: g })),
    ];
    return NextResponse.json({ groups });
  }

  if (body.action === "MERGE") {
    if (!isAdminRole(auth.user.role)) {
      return NextResponse.json({ error: "Owner or Admin only — lead merge deletes a record." }, { status: 403 });
    }
    const schema = z.object({
      keepId: z.string(),
      mergeId: z.string(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid merge" }, { status: 400 });
    if (parsed.data.keepId === parsed.data.mergeId) {
      return NextResponse.json({ error: "Cannot merge into self" }, { status: 400 });
    }

    const [keep, merge] = await Promise.all([
      prisma.crmLead.findUnique({ where: { id: parsed.data.keepId } }),
      prisma.crmLead.findUnique({ where: { id: parsed.data.mergeId } }),
    ]);
    if (!keep || !merge) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.crmActivity.updateMany({
        where: { leadId: merge.id },
        data: { leadId: keep.id },
      }),
      prisma.crmFollowUp.updateMany({
        where: { leadId: merge.id },
        data: { leadId: keep.id },
      }),
      prisma.crmMeeting.updateMany({
        where: { leadId: merge.id },
        data: { leadId: keep.id },
      }),
      prisma.quotation.updateMany({
        where: { leadId: merge.id },
        data: { leadId: keep.id },
      }),
      prisma.crmActivity.create({
        data: {
          leadId: keep.id,
          userId: auth.user.id,
          type: "STATUS",
          body: `Merged duplicate lead ${merge.leadNumber || merge.id} (${merge.fullName}) into this record`,
        },
      }),
      prisma.crmLead.update({
        where: { id: keep.id },
        data: {
          phone: keep.phone || merge.phone,
          company: keep.company || merge.company,
          interest: keep.interest || merge.interest,
          notes: [keep.notes, merge.notes].filter(Boolean).join("\n---\n") || null,
          valueCents: Math.max(keep.valueCents, merge.valueCents),
          tagsJson: mergeTags(keep.tagsJson, merge.tagsJson),
        },
      }),
      prisma.crmLead.delete({ where: { id: merge.id } }),
    ]);

    void writeAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorName: auth.user.fullName,
      action: "UPDATE",
      module: "CRM",
      entityType: "CrmLead",
      entityId: keep.id,
      summary: `Merged lead ${merge.leadNumber} into ${keep.leadNumber}`,
    });

    return NextResponse.json({ ok: true, keepId: keep.id });
  }

  // Excel base64
  if (typeof body.xlsxBase64 === "string") {
    const binary = Buffer.from(body.xlsxBase64, "base64");
    const parsed = parseLeadsSpreadsheet(
      binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength),
      body.filename || "import.xlsx"
    );
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows", parseErrors: parsed.errors },
        { status: 400 }
      );
    }
    const result = await importLeadRows(parsed.rows, auth.user);
    return NextResponse.json(
      {
        created: result.created.length,
        skipped: result.skipped.length,
        leads: result.created,
        skippedRows: result.skipped.slice(0, 20),
        parseErrors: parsed.errors.slice(0, 20),
      },
      { status: 201 }
    );
  }

  // CSV import
  if (typeof body.csv === "string") {
    const parsed = parseLeadsSpreadsheet(body.csv, "import.csv");
    if (parsed.rows.length === 0) {
      // fallback legacy line parser already covered by xlsx sheet_to_json on CSV
      return NextResponse.json(
        { error: "CSV needs header + rows", parseErrors: parsed.errors },
        { status: 400 }
      );
    }
    const result = await importLeadRows(parsed.rows, auth.user);
    return NextResponse.json(
      {
        created: result.created.length,
        skipped: result.skipped.length,
        leads: result.created,
        skippedRows: result.skipped.slice(0, 20),
        parseErrors: parsed.errors.slice(0, 20),
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

function mergeTags(a?: string | null, b?: string | null) {
  try {
    const ta = a ? (JSON.parse(a) as string[]) : [];
    const tb = b ? (JSON.parse(b) as string[]) : [];
    return JSON.stringify([...new Set([...ta, ...tb])]);
  } catch {
    return a || b || null;
  }
}
