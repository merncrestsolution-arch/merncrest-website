import { PrismaClient } from "@prisma/client";
import { seedDissanayakeDistributionErp } from "@/lib/erp/seed-dissanayake-project";

const prisma = new PrismaClient();

seedDissanayakeDistributionErp(prisma)
  .then(({ project, customer }) => {
    console.log("Distribution ERP project seeded:");
    console.log("  Project:", project.projectCode, "—", project.name);
    console.log("  Client:", customer.email, `(${customer.company})`);
    console.log("  Revenue: LKR", (project.revenueCents / 100).toLocaleString("en-LK"));
    console.log("  Balance due: LKR", (project.nextPaymentCents / 100).toLocaleString("en-LK"));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
