import { SL_TIMEZONE } from "@/lib/timezone";

export type DomainDisplayStatus =
  | "Active"
  | "Expiring Soon"
  | "Expired"
  | "Transferred"
  | "Cancelled"
  | "Pending"
  | "Locked";

type DomainLike = {
  status: string;
  expiresAt: Date | string | null;
  locked?: boolean;
};

function daysUntil(expiresAt: Date | string | null): number | null {
  if (!expiresAt) return null;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const today = new Date(
    now.toLocaleString("en-US", { timeZone: SL_TIMEZONE })
  );
  const expLocal = new Date(
    exp.toLocaleString("en-US", { timeZone: SL_TIMEZONE })
  );
  const ms = expLocal.getTime() - today.getTime();
  return Math.ceil(ms / 86400000);
}

export function computeDomainDisplayStatus(domain: DomainLike): DomainDisplayStatus {
  const raw = domain.status.toUpperCase();

  if (raw === "CANCELLED") return "Cancelled";
  if (raw === "TRANSFERRING") return "Transferred";
  if (domain.locked) return "Locked";
  if (raw === "PENDING") return "Pending";

  const days = daysUntil(domain.expiresAt);
  if (days !== null && days < 0) return "Expired";
  if (days !== null && days <= 30) return "Expiring Soon";
  if (raw === "EXPIRED") return "Expired";

  return "Active";
}

export function domainExpiryAlertLevel(
  expiresAt: Date | string | null
): "none" | "30" | "14" | "7" | "expired" {
  const days = daysUntil(expiresAt);
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 7) return "7";
  if (days <= 14) return "14";
  if (days <= 30) return "30";
  return "none";
}

export function computeSslDisplayStatus(
  sslStatus: string,
  sslExpiresAt: Date | string | null
): string {
  const raw = sslStatus.toUpperCase();
  if (["NOT_CONFIGURED", "NONE", "MISSING"].includes(raw)) return "Not Configured";
  if (raw === "FAILED") return "Expired";

  const days = daysUntil(sslExpiresAt);
  if (days !== null && days < 0) return "Expired";
  if (days !== null && days <= 30) return "Expiring Soon";
  if (raw === "ACTIVE" || raw === "OK") return "Active";
  if (raw === "PENDING") return "Not Configured";
  return sslStatus;
}
