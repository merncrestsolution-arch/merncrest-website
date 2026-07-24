/** Client-safe money formatting (no server imports). */
export function formatMoney(cents: number, currency = "LKR") {
  const value = (cents / 100).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${currency} ${value}`;
}

/** Human-friendly blog/article date, e.g. "June 20, 2026". */
export function formatBlogDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
