/**
 * One-time migration: CrmLead.stage CONTACTED → QUALIFIED
 *
 * Why CONTACTED mapped to QUALIFIED (Part 04 onward, ~2025-Q4):
 * "first contact made" was treated as sales-qualified in the Kanban funnel
 * NEW → ASSIGNED → QUALIFIED → … The UI used to silently bucket CONTACTED
 * into the QUALIFIED column; this script writes QUALIFIED into the DB so
 * reporting and Kanban use one stage set. Runtime mapping shim removed.
 *
 * Usage (Postgres must be up):
 *   npx prisma db push
 *   npm run migrate:crm-contacted
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.crmLead.updateMany({
    where: { stage: "CONTACTED" },
    data: { stage: "QUALIFIED" },
  });
  console.log(`Migrated ${result.count} CrmLead row(s) CONTACTED → QUALIFIED`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
