import type { Prisma } from "@prisma/client";
import { nextNumber } from "@/lib/commerce";
import { getQuotationApprovalThresholdCents } from "@/lib/erp/approval-config";
import { writeAuditLog } from "@/lib/erp/audit";
import { notifyUser } from "@/lib/support/notify";

type Tx = Prisma.TransactionClient;

/**
 * When a lead enters QUOTATION stage, ensure a linked quotation exists and
 * create an ApprovalRequest when the quote total exceeds the configured threshold.
 */
export async function handleLeadQuotationStage(
  tx: Tx,
  opts: {
    leadId: string;
    actorId: string;
    actorEmail: string;
    actorName: string;
    quotationId?: string;
  }
): Promise<{ approvalId?: string; quotationId: string }> {
  const lead = await tx.crmLead.findUniqueOrThrow({
    where: { id: opts.leadId },
    select: { id: true, fullName: true, company: true },
  });

  const quotation =
    (opts.quotationId
      ? await tx.quotation.findFirst({
          where: { id: opts.quotationId, leadId: opts.leadId },
        })
      : null) ||
    (await tx.quotation.findFirst({
      where: { leadId: opts.leadId },
      orderBy: { createdAt: "desc" },
    }));

  if (!quotation) {
    throw new Error("QUOTATION_REQUIRED");
  }

  const threshold = await getQuotationApprovalThresholdCents();
  if (quotation.totalCents < threshold) {
    return { quotationId: quotation.id };
  }

  const existingApproval = await tx.approvalRequest.findFirst({
    where: {
      type: "QUOTATION",
      referenceType: "Quotation",
      referenceId: quotation.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
  });
  if (existingApproval) {
    return { approvalId: existingApproval.id, quotationId: quotation.id };
  }

  const title = `Quotation ${quotation.quoteNumber} — ${lead.company || lead.fullName}`;
  const approval = await tx.approvalRequest.create({
    data: {
      requestNumber: nextNumber("APR"),
      type: "QUOTATION",
      title,
      description: `Quote total ${(quotation.totalCents / 100).toFixed(2)} ${quotation.currency} exceeds approval threshold.`,
      status: "PENDING",
      requesterId: opts.actorId,
      referenceType: "Quotation",
      referenceId: quotation.id,
      amountCents: quotation.totalCents,
    },
  });

  await writeAuditLog({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    actorName: opts.actorName,
    action: "CREATE",
    module: "CRM",
    entityType: "ApprovalRequest",
    entityId: approval.id,
    summary: `Quotation approval required for lead ${lead.id}`,
    meta: { leadId: opts.leadId, quotationId: quotation.id },
  });

  return { approvalId: approval.id, quotationId: quotation.id };
}

/**
 * On ApprovalRequest decision for a quotation-linked lead, advance or hold the pipeline.
 */
export async function syncLeadStageFromQuotationApproval(
  tx: Tx,
  opts: {
    approval: {
      id: string;
      type: string;
      referenceType: string | null;
      referenceId: string | null;
      status: string;
      requesterId: string;
      requestNumber: string;
      title: string;
    };
    actorId: string;
    actorEmail: string;
    actorName: string;
  }
): Promise<void> {
  if (opts.approval.type !== "QUOTATION" || opts.approval.referenceType !== "Quotation") {
    return;
  }
  if (!opts.approval.referenceId) return;

  const quotation = await tx.quotation.findUnique({
    where: { id: opts.approval.referenceId },
    select: { leadId: true, quoteNumber: true },
  });
  if (!quotation?.leadId) return;

  const newStage = opts.approval.status === "APPROVED" ? "NEGOTIATION" : "ON_HOLD";
  await tx.crmLead.update({
    where: { id: quotation.leadId },
    data: { stage: newStage },
  });

  await tx.crmActivity.create({
    data: {
      leadId: quotation.leadId,
      userId: opts.actorId,
      type: "STATUS",
      body: `Quotation ${quotation.quoteNumber} ${opts.approval.status.toLowerCase()} — stage → ${newStage}`,
    },
  });

  await writeAuditLog({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    actorName: opts.actorName,
    action: opts.approval.status === "APPROVED" ? "APPROVE" : "REJECT",
    module: "CRM",
    entityType: "CrmLead",
    entityId: quotation.leadId,
    summary: `Lead stage ${newStage} after quotation approval ${opts.approval.requestNumber}`,
  });

  void notifyUser({
    userId: opts.approval.requesterId,
    title: `Quotation ${opts.approval.status.toLowerCase()} · ${opts.approval.requestNumber}`,
    body: opts.approval.title,
    category: "CRM",
    href: "/admin/crm",
  });
}
