import { sendMailRaw } from "@/lib/mail";
import { notifyClient } from "@/lib/notify/client-email";

const FOOTER =
  '<p style="color:#64748b;font-size:12px;margin-top:24px">Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk</p>';

function wrapHtml(body: string) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#333">${body}${FOOTER}</div>`;
}

export async function sendDomainDocApprovedEmail(input: {
  to: string;
  name: string;
  domainName: string;
}) {
  return sendMailRaw({
    to: input.to,
    subject: `Domain registration documents approved — ${input.domainName}`,
    text: `Hi ${input.name},\n\nYour domain registration documents for ${input.domainName} have been approved.\n\nWe will proceed with registration.`,
    html: wrapHtml(`
      <h2 style="color:#7C3AED">Documents approved</h2>
      <p>Hi ${input.name},</p>
      <p>Your domain registration documents for <strong>${input.domainName}</strong> have been approved.</p>
      <p>We will proceed with registration.</p>
    `),
  });
}

export async function sendDomainDocRejectedEmail(input: {
  to: string;
  name: string;
  domainName: string;
  reason: string;
}) {
  return sendMailRaw({
    to: input.to,
    subject: `Domain registration documents rejected — ${input.domainName}`,
    text: `Hi ${input.name},\n\nYour domain registration documents for ${input.domainName} were rejected.\n\nReason:\n${input.reason}`,
    html: wrapHtml(`
      <h2 style="color:#7C3AED">Documents rejected</h2>
      <p>Hi ${input.name},</p>
      <p>Your domain registration documents for <strong>${input.domainName}</strong> were rejected.</p>
      <p><strong>Reason:</strong></p>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${input.reason}</p>
      <p>Please resubmit corrected documents via your customer portal.</p>
    `),
  });
}

export async function sendProjectUpdateEmail(input: {
  to: string;
  name: string;
  projectName: string;
  title: string;
  body: string;
}) {
  return notifyClient("PROJECT_UPDATE", {
    toEmail: input.to,
    vars: {
      name: input.name,
      projectName: input.projectName,
      summary: `${input.title}: ${input.body}`,
    },
  });
}

export async function sendRenewalReminderEmail(input: {
  to: string;
  name: string;
  serviceLabel: string;
  renewalDate: string;
  amountLabel?: string;
}) {
  return sendMailRaw({
    to: input.to,
    subject: `Renewal reminder — ${input.serviceLabel}`,
    text: `Hi ${input.name},\n\nYour ${input.serviceLabel} is due for renewal on ${input.renewalDate}.${input.amountLabel ? `\nAmount: ${input.amountLabel}` : ""}`,
    html: wrapHtml(`
      <h2 style="color:#7C3AED">Renewal reminder</h2>
      <p>Hi ${input.name},</p>
      <p>Your <strong>${input.serviceLabel}</strong> is due for renewal on <strong>${input.renewalDate}</strong>.</p>
      ${input.amountLabel ? `<p>Renewal amount: <strong>${input.amountLabel}</strong></p>` : ""}
      <p>Please contact us or pay your invoice in the customer portal.</p>
    `),
  });
}
