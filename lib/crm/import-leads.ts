import { prisma } from "@/lib/db";
import { nextNumber } from "@/lib/commerce";
import { computeLeadScore } from "@/lib/crm/stages";
import { writeAuditLog } from "@/lib/erp/audit";
import type { ImportedLeadRow } from "@/lib/crm/spreadsheet-import";

export async function importLeadRows(
  rows: ImportedLeadRow[],
  actor: { id: string; email: string; fullName: string }
) {
  const created = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const email = row.email.toLowerCase();
    const phone = row.phone || "";
    const existing = await prisma.crmLead.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });
    if (existing) {
      skipped.push(`${email} (duplicate)`);
      continue;
    }

    const lead = await prisma.crmLead.create({
      data: {
        leadNumber: nextNumber("LD"),
        fullName: row.fullName,
        email,
        phone: phone || null,
        company: row.company || null,
        interest: row.interest || null,
        source: "IMPORT",
        stage: "NEW",
        ownerId: actor.id,
        tagsJson: row.tags
          ? JSON.stringify(
              row.tags
                .split(/[|,]/)
                .map((t) => t.trim())
                .filter(Boolean)
            )
          : null,
        leadScore: computeLeadScore({
          phone: phone || null,
          company: row.company || null,
          interest: row.interest || null,
          valueCents: 0,
          budgetCents: 0,
          priority: "MEDIUM",
        }),
      },
    });
    created.push(lead);
  }

  void writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    actorName: actor.fullName,
    action: "CREATE",
    module: "CRM",
    entityType: "CrmLead",
    summary: `Spreadsheet import: ${created.length} created, ${skipped.length} skipped`,
  });

  return { created, skipped };
}
