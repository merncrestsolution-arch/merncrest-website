import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:host:v1:";

function resolveKey(): Buffer {
  const raw =
    process.env.HOSTING_CREDENTIALS_KEY ||
    process.env.PII_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "dev-only-hosting-credentials-key";
  return createHash("sha256").update(raw).digest();
}

export function encryptCredential(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null;
  if (plaintext.startsWith(PREFIX)) return plaintext;

  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");
  return `${PREFIX}${payload}`;
}

export function decryptCredential(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null || ciphertext === "") return null;
  if (!ciphertext.startsWith(PREFIX)) return ciphertext;

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
    console.error("[credentials:decrypt]", error);
    return null;
  }
}

export function maskCredential(value: string | null | undefined): string {
  if (!value) return "••••••••";
  const plain = value.startsWith(PREFIX) ? decryptCredential(value) : value;
  if (!plain) return "••••••••";
  if (plain.length <= 4) return "••••";
  return `${"•".repeat(Math.min(plain.length - 2, 12))}${plain.slice(-2)}`;
}
