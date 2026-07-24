import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:ai:v1:";

function resolveKey(): Buffer {
  const raw =
    process.env.AI_CONFIG_SECRET ||
    process.env.PII_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    "dev-only-ai-config-key";
  return createHash("sha256").update(raw).digest();
}

export function encryptAiSecret(plaintext: string): string {
  if (plaintext.startsWith(PREFIX)) return plaintext;
  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString("base64url");
  return `${PREFIX}${payload}`;
}

export function decryptAiSecret(ciphertext: string): string | null {
  if (!ciphertext.startsWith(PREFIX)) {
    // Allow plaintext during first save migration
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
    console.error("[ai:crypto:decrypt]", error);
    return null;
  }
}

export function maskApiKey(key: string | null | undefined): string {
  if (!key) return "";
  const plain = key.startsWith(PREFIX) ? decryptAiSecret(key) : key;
  if (!plain) return "****";
  if (plain.length <= 8) return "****";
  return `${plain.slice(0, 3)}....${plain.slice(-4)}`;
}
