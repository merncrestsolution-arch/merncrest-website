import { md5 } from "@/lib/services/fulfillment";

/**
 * PayHere checkout helpers (Sri Lanka).
 * Docs: https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
export function getPayHereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";
  const sandbox = process.env.PAYHERE_SANDBOX !== "false";
  const checkoutUrl = sandbox
    ? "https://sandbox.payhere.lk/pay/checkout"
    : "https://www.payhere.lk/pay/checkout";
  const configured = Boolean(merchantId && merchantSecret);
  return { merchantId, merchantSecret, sandbox, checkoutUrl, configured };
}

export function buildPayHereHash(opts: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  merchantSecret: string;
}) {
  const secretHash = md5(opts.merchantSecret);
  return md5(opts.merchantId + opts.orderId + opts.amount + opts.currency + secretHash);
}

export function verifyPayHereNotify(params: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  statusCode: string;
  md5sig: string;
  merchantSecret: string;
}) {
  const local = md5(
    params.merchantId +
      params.orderId +
      params.amount +
      params.currency +
      params.statusCode +
      md5(params.merchantSecret)
  );
  return local === params.md5sig.toUpperCase();
}

export function formatPayHereAmount(cents: number) {
  return (cents / 100).toFixed(2);
}
