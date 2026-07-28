import { encryptCredential, decryptCredential } from "@/lib/security/credentials";

export type ProjectCredentialEntry = {
  label: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
};

export function encryptEnvVars(vars: Record<string, string>): string | null {
  if (!Object.keys(vars).length) return null;
  return encryptCredential(JSON.stringify(vars));
}

export function decryptEnvVars(ciphertext: string | null | undefined): Record<string, string> {
  if (!ciphertext) return {};
  const raw = decryptCredential(ciphertext);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function encryptCredentials(entries: ProjectCredentialEntry[]): string | null {
  if (!entries.length) return null;
  return encryptCredential(JSON.stringify(entries));
}

export function decryptCredentials(
  ciphertext: string | null | undefined
): ProjectCredentialEntry[] {
  if (!ciphertext) return [];
  const raw = decryptCredential(ciphertext);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProjectCredentialEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function maskEnvVars(vars: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    out[key] = value ? "••••••••" : "";
  }
  return out;
}

export function maskCredentials(entries: ProjectCredentialEntry[]): ProjectCredentialEntry[] {
  return entries.map((e) => ({
    label: e.label,
    username: e.username ? "••••••••" : undefined,
    password: e.password ? "••••••••" : undefined,
    url: e.url,
    notes: e.notes,
  }));
}
