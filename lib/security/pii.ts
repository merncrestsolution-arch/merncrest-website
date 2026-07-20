/**
 * Application-level PII encryption for Sri Lanka PDPA compliance.
 *
 * Fields: CustomerProfile.nicPassport, CustomerProfile.businessReg
 * (and registrant nicOrBr snapshots where encrypted).
 *
 * DATA RETENTION (policy decision pending — do not auto-delete yet):
 * - NIC / passport / BR numbers are retained while the customer account is active
 *   and for a period after closure required for tax, domain registry, and dispute
 *   obligations. Exact retention window must be set by legal/compliance.
 * - Encrypted ciphertext remains in DB until a retention job is approved.
 * - Access: ADMIN/OWNER (Customer 360) and the owning customer (portal). All admin
 *   reads of these fields MUST write an AuditLog entry (pii.read).
 *
 * Key: PII_ENCRYPTION_KEY (32-byte hex or base64) or derived from AUTH_SECRET.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function resolveKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY || process.env.AUTH_SECRET || "dev-only-pii-key";
  // Derive a stable 32-byte key
  return createHash("sha256").update(raw).digest();
}

/** Encrypt plaintext for at-rest storage. Returns null for empty input. */
export function encryptPii(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  // Already encrypted — idempotent
  if (plaintext.startsWith(PREFIX)) return plaintext;

  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");
  return `${PREFIX}${payload}`;
}

/** Decrypt ciphertext. Passes through legacy plaintext for gradual migration. */
export function decryptPii(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null;
  if (!ciphertext.startsWith(PREFIX)) {
    // Legacy plaintext row — return as-is (re-encrypt on next write)
    return ciphertext;
  }

  try {
    const key = resolveKey();
    const raw = Buffer.from(ciphertext.slice(PREFIX.length), "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (error) {
    console.error("[pii:decrypt]", error);
    return null;
  }
}

export function isEncryptedPii(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

/** Redact for non-authorized responses */
export function redactPii(value: string | null | undefined): string | null {
  if (!value) return null;
  const plain = decryptPii(value);
  if (!plain) return null;
  if (plain.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, plain.length - 4))}${plain.slice(-4)}`;
}
