/**
 * Part 04 CRM lead stages.
 *
 * CONTACTED was a legacy stage from the pre–Part 04 pipeline. Since Part 04
 * (CRM Kanban, ~2025-Q4 platform baseline), CONTACTED was silently displayed
 * in the QUALIFIED column because "first contact made" maps to sales-qualified
 * in the current funnel: NEW → ASSIGNED → QUALIFIED → …
 *
 * P0 hardening (2026-07): one-time migration `scripts/migrate-crm-contacted.ts`
 * rewrites remaining CONTACTED rows to QUALIFIED. CONTACTED is no longer a
 * writable or display stage — the runtime mapping shim was removed after that
 * migration. Re-run the script if any stale CONTACTED rows reappear.
 */

export const CRM_STAGES = [
  "NEW",
  "ASSIGNED",
  "QUALIFIED",
  "MEETING",
  "QUOTATION",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ON_HOLD",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

/** Kanban columns shown in Admin CRM — matches CRM_STAGES (no CONTACTED) */
export const CRM_KANBAN_STAGES: CrmStage[] = [...CRM_STAGES];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  QUALIFIED: "Qualified",
  MEETING: "Meeting Scheduled",
  QUOTATION: "Quotation Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
  ON_HOLD: "On Hold",
};

export function computeLeadScore(input: {
  budgetCents?: number;
  valueCents?: number;
  priority?: string;
  interest?: string | null;
  phone?: string | null;
  company?: string | null;
}): number {
  let score = 20;
  if (input.phone) score += 10;
  if (input.company) score += 10;
  if (input.interest) score += 10;
  if ((input.budgetCents || 0) >= 5000000) score += 25;
  else if ((input.budgetCents || 0) >= 1000000) score += 15;
  else if ((input.budgetCents || 0) > 0) score += 8;
  if ((input.valueCents || 0) >= 1000000) score += 15;
  if (input.priority === "URGENT") score += 20;
  else if (input.priority === "HIGH") score += 12;
  else if (input.priority === "MEDIUM") score += 5;
  return Math.min(100, Math.max(0, score));
}
