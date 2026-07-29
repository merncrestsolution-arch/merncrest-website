import { sendMail } from "@/lib/mail";

const FOOTER =
  "Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendClientWelcomeEmail(opts: {
  to: string;
  fullName: string;
  portalUrl: string;
}) {
  const name = escapeHtml(opts.fullName.trim() || "there");
  const portalUrl = escapeHtml(opts.portalUrl);

  const subject = "Welcome to MernCrest — your customer portal is ready";
  const text = [
    `Hi ${opts.fullName.trim() || "there"},`,
    "",
    "Welcome to MernCrest. Your customer portal account is ready.",
    "",
    `Open your portal: ${opts.portalUrl}`,
    "",
    "From your portal you can view invoices, manage services, open support tickets, and track project updates.",
    "",
    FOOTER,
  ].join("\n");

  const html = `
    <div style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;background:#f8fafc;padding:24px">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.06)">
        <div style="background:linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%);padding:28px 32px">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600">Welcome to MernCrest</h1>
          <p style="margin:8px 0 0;color:#e9d5ff;font-size:14px">Your customer portal is ready</p>
        </div>
        <div style="padding:32px">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155">
            Thank you for choosing MernCrest. Your account has been set up and you can now access your customer portal to manage services, billing, and support in one place.
          </p>
          <p style="margin:0 0 24px">
            <a href="${portalUrl}" style="display:inline-block;background:#14b8a6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open customer portal</a>
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:14px;line-height:1.7">
            <li>View and pay invoices</li>
            <li>Track domains, hosting, and project services</li>
            <li>Submit support requests and follow project updates</li>
          </ul>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">
            If the button does not work, copy this link into your browser:<br/>
            <a href="${portalUrl}" style="color:#7c3aed;word-break:break-all">${portalUrl}</a>
          </p>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8">
          ${FOOTER}
        </div>
      </div>
    </div>`;

  return sendMail({ to: opts.to, subject, text, html });
}
