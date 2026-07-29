/**
 * Phase 1 smoke checks — multi-service projects, domains, hosting.
 * Usage: npx tsx scripts/smoke-phase1.ts
 */

import { PrismaClient } from "@prisma/client";
import { calculateRenewalDate } from "../shared/renewal-calculator";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK  ${msg}`);
}

async function checkTable(table: string) {
  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    table
  );
  return rows[0]?.exists === true;
}

async function checkColumns(table: string, columns: string[]) {
  const found = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = ANY($2::text[])`,
    table,
    columns
  );
  return found.map((r) => r.column_name);
}

async function main() {
  // Renewal calculator
  const renewal = calculateRenewalDate({
    startDate: new Date("2026-01-15T10:00:00.000Z"),
    billingCycle: "ANNUAL",
  });
  assert(renewal.getUTCFullYear() === 2027, "calculateRenewalDate annual cycle");

  const slEdge = calculateRenewalDate({
    startDate: new Date("2026-01-15T18:30:00.000Z"),
    billingCycle: "MONTHLY",
  });
  assert(
    slEdge.toISOString() === "2026-02-15T18:30:00.000Z",
    "calculateRenewalDate SL timezone edge case"
  );

  // Tables
  const tables = [
    "Project",
    "ProjectService",
    "ServiceDomain",
    "ServiceDomainHistoryEntry",
    "ServiceHostingAccount",
    "ServiceHostingHistoryEntry",
  ];
  for (const t of tables) {
    assert(await checkTable(t), `Table "${t}" exists`);
  }

  // Audit columns on Project
  const projectCols = await checkColumns("Project", [
    "deletedAt",
    "createdBy",
    "updatedBy",
  ]);
  assert(projectCols.length === 3, "Project has deletedAt, createdBy, updatedBy");

  // ProjectService reminderScheduleDays
  const psCols = await checkColumns("ProjectService", [
    "reminderScheduleDays",
    "renewalDate",
    "metadata",
  ]);
  assert(psCols.length === 3, "ProjectService has reminderScheduleDays, renewalDate, metadata");

  // Enums
  const enums = await prisma.$queryRawUnsafe<{ typname: string }[]>(
    `SELECT typname FROM pg_type
     WHERE typname IN ('ServiceType','BillingCycle','DomainStatus','HostingStatus')`
  );
  assert(enums.length === 4, "Phase 1 enums registered in PostgreSQL");

  // Prisma client can query new models
  const projectCount = await prisma.project.count();
  const serviceCount = await prisma.projectService.count();
  console.log(`INFO  Project rows: ${projectCount}, ProjectService rows: ${serviceCount}`);

  console.log("\nPhase 1 smoke checks passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
