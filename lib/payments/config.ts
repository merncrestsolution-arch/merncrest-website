/**
 * Payment gateway feature flags.
 * Automatic gateways (PayHere, Stripe) are disabled by default.
 * Enable via PAYMENT_GATEWAY_ENABLED=true + PayHere merchant credentials.
 *
 * Primary path: bank transfer → admin verification → auto-provision.
 */
export function isAutomaticGatewayEnabled() {
  return process.env.PAYMENT_GATEWAY_ENABLED === "true";
}

export function isPayHereReady() {
  return (
    isAutomaticGatewayEnabled() &&
    Boolean(process.env.PAYHERE_MERCHANT_ID && process.env.PAYHERE_MERCHANT_SECRET)
  );
}

export function getEnabledPaymentMethods() {
  const methods: string[] = ["MANUAL", "BANK_TRANSFER"];
  if (isAutomaticGatewayEnabled()) {
    methods.push("PAYHERE");
    if (process.env.STRIPE_SECRET_KEY) methods.push("STRIPE");
  }
  // Demo remains available for local/dev testing
  if (process.env.NODE_ENV !== "production" || process.env.PAYMENT_DEMO_ENABLED === "true") {
    methods.push("DEMO");
  }
  return methods;
}

export type BankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  currency: string;
  purpose: string;
};

/** People's Bank + Commercial Bank accounts shown at checkout */
export function getBankAccounts(): BankAccount[] {
  return [
    {
      bankName: process.env.BANK_COMMERCIAL_NAME || "Commercial Bank of Ceylon",
      accountName:
        process.env.BANK_COMMERCIAL_ACCOUNT_NAME ||
        process.env.BANK_ACCOUNT_NAME ||
        "MernCrest Solutions (Pvt) Ltd",
      accountNumber:
        process.env.BANK_COMMERCIAL_ACCOUNT_NUMBER ||
        process.env.BANK_ACCOUNT_NUMBER ||
        "1234567890",
      branch: process.env.BANK_COMMERCIAL_BRANCH || process.env.BANK_BRANCH || "Colombo",
      currency: "LKR",
      purpose: "General invoices & hosting (LKR)",
    },
    {
      bankName: process.env.BANK_PEOPLES_NAME || "People's Bank",
      accountName:
        process.env.BANK_PEOPLES_ACCOUNT_NAME ||
        process.env.BANK_ACCOUNT_NAME ||
        "MernCrest Solutions (Pvt) Ltd",
      accountNumber: process.env.BANK_PEOPLES_ACCOUNT_NUMBER || "0987654321",
      branch: process.env.BANK_PEOPLES_BRANCH || "Colombo Fort",
      currency: "LKR",
      purpose: "Domain & marketplace orders (LKR)",
    },
  ];
}

/** @deprecated Prefer getBankAccounts() — kept for older clients */
export const BANK_TRANSFER_INSTRUCTIONS = {
  ...getBankAccounts()[0],
  note: "Include your invoice number as the payment reference. Upload your transfer receipt. Services activate after admin verification.",
  accounts: getBankAccounts(),
};

/** Payments pending verification longer than this are SLA-breached (ms) */
export const PAYMENT_VERIFY_SLA_MS = 2 * 60 * 60 * 1000;
