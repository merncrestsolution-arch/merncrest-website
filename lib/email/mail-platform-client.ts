import { randomBytes } from "crypto";

const MAIL_PLATFORM_API_URL = process.env.MAIL_PLATFORM_API_URL || "";
const MAIL_PLATFORM_API_TOKEN = process.env.MAIL_PLATFORM_API_TOKEN || "";

export type ProvisionMailboxResult = {
  externalId?: string;
  provisioned: boolean;
};

export async function provisionMailboxOnMailPlatform(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<ProvisionMailboxResult> {
  if (!MAIL_PLATFORM_API_URL || !MAIL_PLATFORM_API_TOKEN) {
    return { provisioned: false };
  }

  const base = MAIL_PLATFORM_API_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/api/admin/mailboxes/provision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MAIL_PLATFORM_API_TOKEN}`,
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Mail platform provision failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { data?: { id?: string } };
  return { provisioned: true, externalId: data.data?.id };
}

export function defaultMailHosts(domain: string) {
  const mailHost = process.env.MAIL_SMTP_HOST || `mail.${domain}`;
  return {
    smtpHost: mailHost,
    smtpPort: Number(process.env.MAIL_SMTP_PORT || 587),
    imapHost: process.env.MAIL_IMAP_HOST || mailHost,
    imapPort: Number(process.env.MAIL_IMAP_PORT || 993),
  };
}

export function generateMailboxPassword(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}
