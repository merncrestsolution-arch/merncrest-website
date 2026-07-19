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
  return sendMail({
    to,
    subject: "Verify your MernCrest account",
    text: `Welcome to MernCrest.\n\nVerify your email:\n${verifyUrl}`,
    html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h1 style="color:#7C3AED">MernCrest</h1>
      <p>Welcome — confirm your email to activate your customer portal.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#14B8A6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Verify email</a></p>
    </div>`,
  });
}

export async function sendOrderConfirmationEmail(opts: {
  to: string;
  orderNumber: string;
  invoiceNumber: string;
  totalLabel: string;
  items: string[];
}) {
  const list = opts.items.map((i) => `• ${i}`).join("\n");
  return sendMail({
    to: opts.to,
    subject: `Order confirmed ${opts.orderNumber} — MernCrest`,
    text: `Thank you for your order ${opts.orderNumber}.\nInvoice ${opts.invoiceNumber}\nTotal ${opts.totalLabel}\n\n${list}\n\nServices will appear in your portal after payment.`,
    html: `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h1 style="color:#7C3AED">Order confirmed</h1>
      <p>Order <strong>${opts.orderNumber}</strong> · Invoice <strong>${opts.invoiceNumber}</strong></p>
      <p>Total: <strong>${opts.totalLabel}</strong></p>
      <ul>${opts.items.map((i) => `<li>${i}</li>`).join("")}</ul>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk"}/en/portal/invoices">Pay invoice / view portal</a></p>
    </div>`,
  });
}

export async function sendProvisioningEmail(opts: {
  to: string;
  orderNumber: string;
  summary: string[];
}) {
  return sendMail({
    to: opts.to,
    subject: `Services activated — ${opts.orderNumber}`,
    text: `Your MernCrest services are active.\n\n${opts.summary.join("\n")}\n\nOpen your customer portal to manage domains and hosting.`,
    html: `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h1 style="color:#7C3AED">Services activated</h1>
      <p>Order <strong>${opts.orderNumber}</strong> has been provisioned.</p>
      <ul>${opts.summary.map((s) => `<li>${s}</li>`).join("")}</ul>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk"}/en/portal">Open dashboard</a></p>
    </div>`,
  });
}

async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const from = process.env.CONTACT_EMAIL || "noreply@merncrest.lk";
  const transport = getTransport();
  if (!transport) {
    console.info("[mail:dev]", opts.subject, { to: opts.to, text: opts.text });
    return { queued: false, logged: true };
  }
  await transport.sendMail({ from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
  return { queued: true, logged: false };
}
