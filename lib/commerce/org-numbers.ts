import { prisma } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/lib/chat/org";

export type OrgNumberKind = "ORDER" | "INVOICE" | "RECEIPT" | "QUOTATION";

const DEFAULT_PREFIX: Record<OrgNumberKind, string> = {
  ORDER: "ORD",
  INVOICE: "INV",
  RECEIPT: "RCP",
  QUOTATION: "QT",
};

/** Middle segment in ORD-ERP-45872 (override via COMMERCE_NUMBER_SEGMENT). */
const DOC_SEGMENT = (process.env.COMMERCE_NUMBER_SEGMENT || "ERP").toUpperCase();

/** First number for a new sequence (override via COMMERCE_NUMBER_START). */
const NUMBER_START = Number(process.env.COMMERCE_NUMBER_START || 45872);

function formatOrgNumber(kind: OrgNumberKind, sequence: number): string {
  return `${DEFAULT_PREFIX[kind]}-${DOC_SEGMENT}-${sequence}`;
}

type NextOrgNumberOpts = {
  organizationId?: string;
  branchId?: string | null;
  prefix?: string;
};

/** Collision-safe sequential numbers per organization + branch (ORD/INV/RCP/QT-ERP-45872). */
export async function nextOrgNumber(
  kind: OrgNumberKind,
  opts?: NextOrgNumberOpts
): Promise<string> {
  const organizationId = opts?.organizationId ?? (await getPrimaryOrganizationId());
  const branchKey = opts?.branchId ?? "";
  const p = opts?.prefix || DEFAULT_PREFIX[kind];

  const seq = await prisma.$transaction(async (tx) => {
    const existing = await tx.orgNumberSequence.findUnique({
      where: {
        organizationId_branchId_kind: {
          organizationId,
          branchId: branchKey,
          kind,
        },
      },
    });
    if (!existing) {
      return tx.orgNumberSequence.create({
        data: {
          organizationId,
          branchId: branchKey,
          kind,
          prefix: p,
          nextValue: NUMBER_START + 1,
        },
      });
    }
    if (existing.nextValue < NUMBER_START) {
      return tx.orgNumberSequence.update({
        where: { id: existing.id },
        data: { prefix: p, nextValue: NUMBER_START + 1 },
      });
    }
    return tx.orgNumberSequence.update({
      where: { id: existing.id },
      data: { nextValue: { increment: 1 } },
    });
  });

  const n = seq.nextValue - 1;
  return formatOrgNumber(kind, n);
}

/** Seed / migrate counters so the next ID is at least COMMERCE_NUMBER_START. */
export async function ensureOrgNumberSequences(
  organizationId: string,
  branchId = ""
): Promise<void> {
  const kinds: OrgNumberKind[] = ["ORDER", "INVOICE", "RECEIPT", "QUOTATION"];
  for (const kind of kinds) {
    const prefix = DEFAULT_PREFIX[kind];
    const existing = await prisma.orgNumberSequence.findUnique({
      where: {
        organizationId_branchId_kind: { organizationId, branchId, kind },
      },
    });
    if (!existing) {
      await prisma.orgNumberSequence.create({
        data: { organizationId, branchId, kind, prefix, nextValue: NUMBER_START + 1 },
      });
      continue;
    }
    if (existing.nextValue < NUMBER_START) {
      await prisma.orgNumberSequence.update({
        where: { id: existing.id },
        data: { prefix, nextValue: NUMBER_START + 1 },
      });
    }
  }
}

/** Assign or return the stored receipt number for a payment row. */
export async function resolveReceiptNumber(payment: {
  id: string;
  receiptNumber: string | null;
}): Promise<string> {
  if (payment.receiptNumber) return payment.receiptNumber;

  const receiptNumber = await nextOrgNumber("RECEIPT");
  const updated = await prisma.payment.updateMany({
    where: { id: payment.id, receiptNumber: null },
    data: { receiptNumber },
  });

  if (updated.count > 0) return receiptNumber;

  const again = await prisma.payment.findUnique({
    where: { id: payment.id },
    select: { receiptNumber: true },
  });
  if (again?.receiptNumber) return again.receiptNumber;

  return receiptNumber;
}
