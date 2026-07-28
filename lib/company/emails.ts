/**
 * Official MernCrest public mailboxes on merncrest.lk.
 * Configure forwarding / SMTP in your DNS + email provider (Google Workspace, Zoho, Brevo, etc.).
 */
export const COMPANY_DOMAIN = "merncrest.lk";

export const COMPANY_EMAILS = {
  /** General company inquiries & public footer */
  info: `info@${COMPANY_DOMAIN}`,
  /** Customer support, billing, tickets */
  support: `support@${COMPANY_DOMAIN}`,
  /** Contact form, sales, partnerships */
  contact: `contact@${COMPANY_DOMAIN}`,
  /** Job applications & HR */
  careers: `careers@${COMPANY_DOMAIN}`,
  /** System / transactional outbound only */
  noreply: `noreply@${COMPANY_DOMAIN}`,
  /** Legacy alias — prefer info@ or contact@ */
  hello: `hello@${COMPANY_DOMAIN}`,
} as const;

export type CompanyMailbox = keyof typeof COMPANY_EMAILS;

/** Primary address shown in footer and legal pages */
export const PRIMARY_PUBLIC_EMAIL = COMPANY_EMAILS.info;

/** Default reply-to for outbound system mail */
export const DEFAULT_REPLY_TO = COMPANY_EMAILS.contact;

/** Default outbound "from" for transactional mail (SMTP must authorize this sender) */
export const DEFAULT_FROM_EMAIL =
  process.env.MAIL_FROM_ADDRESS || COMPANY_EMAILS.noreply;

export function mailto(
  mailbox: CompanyMailbox,
  opts?: { subject?: string; body?: string }
): string {
  const email = COMPANY_EMAILS[mailbox];
  const params = new URLSearchParams();
  if (opts?.subject) params.set("subject", opts.subject);
  if (opts?.body) params.set("body", opts.body);
  const qs = params.toString();
  return qs ? `mailto:${email}?${qs}` : `mailto:${email}`;
}
