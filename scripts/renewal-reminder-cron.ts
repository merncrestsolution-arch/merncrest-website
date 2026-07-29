/**
 * Run renewal reminder job (schedule via cron or task scheduler).
 * Usage: npm run cron:renewal-reminders
 */
import { processRenewalReminders } from "../lib/jobs/renewal-reminders";

async function main() {
  const result = await processRenewalReminders();
  console.log("Renewal reminders:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
