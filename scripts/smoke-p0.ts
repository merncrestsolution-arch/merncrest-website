/**
 * Quick P0 smoke checks (no HTTP server required).
 * Usage: npx tsx scripts/smoke-p0.ts
 */

import { encryptPii, decryptPii, isEncryptedPii } from "../lib/security/pii";
import { convertToLkrCents } from "../lib/providers/fx";
import { calculateSellingPrice } from "../lib/providers/pricing-engine";
import { getBankAccounts, PAYMENT_VERIFY_SLA_MS } from "../lib/payments/config";
import { CRM_STAGES, CRM_KANBAN_STAGES } from "../lib/crm/stages";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK  ${msg}`);
}

async function main() {
  // PII
  const enc = encryptPii("199012345678");
  assert(!!enc && isEncryptedPii(enc), "PII encrypts with enc:v1 prefix");
  assert(decryptPii(enc) === "199012345678", "PII decrypts correctly");

  // FX
  const lkr = convertToLkrCents(1200, "USD", 320, 2); // $12 @ 320 + 2%
  assert(lkr === Math.round(12 * 320 * 1.02 * 100), `USD→LKR with 2% buffer = ${lkr}`);

  // Margin modes
  const fixed = calculateSellingPrice(190000, {
    marginCents: 30000,
    marginPercent: 0,
    marginMode: "FIXED",
  });
  assert(fixed === 220000, `FIXED margin 190000+30000=${fixed}`);
  const pct = calculateSellingPrice(190000, {
    marginCents: 0,
    marginPercent: 15,
    marginMode: "PERCENT",
  });
  assert(pct === 190000 + Math.round(190000 * 0.15), `PERCENT margin = ${pct}`);

  // Banks
  const banks = getBankAccounts();
  assert(banks.length >= 2, `Dual bank accounts (${banks.length})`);
  assert(
    banks.some((b) => /commercial/i.test(b.bankName)) &&
      banks.some((b) => /people/i.test(b.bankName)),
    "Commercial + People's Bank present"
  );
  assert(PAYMENT_VERIFY_SLA_MS === 2 * 60 * 60 * 1000, "2h payment SLA");

  // CRM stages — no CONTACTED
  assert(!CRM_STAGES.includes("CONTACTED" as never), "CONTACTED removed from CRM_STAGES");
  assert(
    CRM_KANBAN_STAGES.every((s) => CRM_STAGES.includes(s)),
    "Kanban matches CRM_STAGES"
  );

  // Schema columns exist
  const margins = await prisma.pricingMargin.findMany({ take: 1 });
  void margins;
  const sample = await prisma.$queryRawUnsafe<
    { column_name: string }[]
  >(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Order' AND column_name IN ('provisioningAttempts','lastProvisionError')`
  );
  assert(sample.length === 2, "Order provisioning columns present");

  const payCols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'Payment' AND column_name IN ('proofImageUrl','referenceNumber')`
  );
  assert(payCols.length === 2, "Payment receipt columns present");

  const contacted = await prisma.crmLead.count({ where: { stage: "CONTACTED" } });
  assert(contacted === 0, "No CONTACTED CrmLead rows remain");

  console.log("\nAll P0 smoke checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
