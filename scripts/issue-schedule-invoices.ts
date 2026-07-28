import { PrismaClient } from "@prisma/client";
import { issueInvoicesForPendingSchedules } from "@/lib/billing/issue-schedule-invoices";

const prisma = new PrismaClient();

async function main() {
  const customerEmail = process.argv[2];
  const projectCode = process.argv[3];

  let customerId: string | undefined;
  if (customerEmail) {
    const u = await prisma.user.findFirst({
      where: { email: customerEmail },
      select: { id: true },
    });
    if (!u) throw new Error(`Customer not found: ${customerEmail}`);
    customerId = u.id;
  }

  let projectId: string | undefined;
  if (projectCode) {
    const p = await prisma.erpProject.findFirst({
      where: { projectCode },
      select: { id: true },
    });
    if (!p) throw new Error(`Project not found: ${projectCode}`);
    projectId = p.id;
  }

  const result = await issueInvoicesForPendingSchedules(prisma, {
    customerId,
    projectId,
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
