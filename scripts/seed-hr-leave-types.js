const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const types = [
  ["ANNUAL", "Annual Leave", true, 14, 10],
  ["CASUAL", "Casual Leave", true, 7, 20],
  ["SICK", "Sick Leave", true, 7, 30],
  ["UNPAID", "Unpaid Leave", false, null, 40],
  ["MATERNITY", "Maternity Leave", true, 84, 50],
  ["PATERNITY", "Paternity Leave", true, 3, 60],
  ["STUDY", "Study Leave", true, 5, 70],
  ["OTHER", "Custom / Other", false, null, 80],
];

(async () => {
  for (const [code, name, paid, maxDays, sortOrder] of types) {
    await p.leaveTypeConfig.upsert({
      where: { code },
      create: { code, name, paid, maxDays, sortOrder },
      update: { name, paid, maxDays, active: true, sortOrder },
    });
  }
  const n = await p.workShift.count();
  if (!n) {
    await p.workShift.create({
      data: { name: "Standard Day", startTime: "09:00", endTime: "17:30" },
    });
  }
  console.log("Seeded leave types + shift");
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
