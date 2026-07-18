/** Client-safe money formatting (no server imports). */
export function formatMoney(cents: number, currency = "LKR") {
  const value = (cents / 100).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${value}`;
}
