import { getBankAccounts } from "@/lib/payments/config";

export function buildBankAccountsHtml(): string {
  const accounts = getBankAccounts();
  return accounts
    .map(
      (a) =>
        `<strong>${escapeHtml(a.bankName)}</strong> — ${escapeHtml(a.accountName)} · ${escapeHtml(a.accountNumber)} (${escapeHtml(a.branch)}) · ${escapeHtml(a.purpose)}`
    )
    .join("<br/>");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
