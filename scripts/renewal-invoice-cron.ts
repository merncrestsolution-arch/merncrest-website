/**
 * Issue renewal invoices for services due within 14 days.
 * Usage: npm run cron:renewal-invoices
 */
import { processRenewalInvoices } from "../lib/billing/renewal-invoices";

async function main() {
  const result = await processRenewalInvoices();
  console.log("Renewal invoices:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
