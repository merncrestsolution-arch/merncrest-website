import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const from = process.env.CONTACT_EMAIL || "noreply@merncrest.lk";
  const transport = getTransport();

  const subject = "Verify your MernCrest account";
  const text = `Welcome to MernCrest.\n\nVerify your email by opening this link:\n${verifyUrl}\n\nIf you did not create an account, ignore this email.`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h1 style="color:#0B1622">MernCrest</h1>
      <p>Welcome — confirm your email to activate your customer portal.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#14B8A6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Verify email</a></p>
      <p style="color:#64748B;font-size:13px">Or paste this URL:<br/>${verifyUrl}</p>
    </div>
  `;

  if (!transport) {
    console.info("[mail:dev] Verification email (SMTP not configured):", { to, verifyUrl });
    return { queued: false, logged: true };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { queued: true, logged: false };
}
