import { prisma } from "@/lib/db";
import { encryptPii } from "@/lib/security/pii";
import { sendMailRaw } from "@/lib/mail";
import {
  defaultMailHosts,
  generateMailboxPassword,
  provisionMailboxOnMailPlatform,
} from "@/lib/email/mail-platform-client";

function slugifyLocalPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
}

export async function provisionClientBusinessMailbox(input: {
  userId: string;
  fullName: string;
  company?: string | null;
  localPart?: string;
  domain?: string;
  projectId?: string | null;
  actorId: string;
  sendCredentialsEmail?: boolean;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, fullName: true, company: true },
  });
  if (!user) return { error: "NOT_FOUND" as const };

  const existing = await prisma.businessMailbox.findFirst({
    where: { userId: input.userId, deletedAt: null, status: { in: ["PENDING", "ACTIVE"] } },
  });
  if (existing) return { mailbox: existing, password: null, created: false };

  const domain = input.domain || process.env.BUSINESS_MAIL_DOMAIN || "merncrest.lk";
  const baseLocal =
    input.localPart ||
    slugifyLocalPart(input.company || user.company || user.fullName || "client");
  let localPart = baseLocal || "client";
  let email = `${localPart}@${domain}`;

  for (let i = 0; i < 20; i += 1) {
    const taken = await prisma.businessMailbox.findFirst({
      where: { email, deletedAt: null },
      select: { id: true },
    });
    if (!taken) break;
    localPart = `${baseLocal}${i + 1}`;
    email = `${localPart}@${domain}`;
  }

  const password = generateMailboxPassword();
  const hosts = defaultMailHosts(domain);

  let status: "PENDING" | "ACTIVE" = "PENDING";
  let provisionedAt: Date | null = null;

  try {
    const provisioned = await provisionMailboxOnMailPlatform({
      email,
      password,
      displayName: input.fullName || user.fullName,
    });
    if (provisioned.provisioned) {
      status = "ACTIVE";
      provisionedAt = new Date();
    }
  } catch (err) {
    console.error("[professional-mailbox] provision failed:", err);
  }

  const mailbox = await prisma.businessMailbox.create({
    data: {
      userId: user.id,
      email,
      localPart,
      domain,
      passwordEnc: encryptPii(password) || password,
      smtpHost: hosts.smtpHost,
      smtpPort: hosts.smtpPort,
      imapHost: hosts.imapHost,
      imapPort: hosts.imapPort,
      status,
      projectId: input.projectId ?? null,
      provisionedAt,
      createdBy: input.actorId,
      updatedBy: input.actorId,
    },
  });

  if (input.sendCredentialsEmail !== false) {
    void sendMailRaw({
      to: user.email,
      subject: `Your professional email account — ${email}`,
      text: `Hi ${user.fullName},\n\nYour MernCrest business email has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nSMTP: ${hosts.smtpHost}:${hosts.smtpPort}\nIMAP: ${hosts.imapHost}:${hosts.imapPort}\n\nPlease change your password after first login.\n\nPowered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#333">
          <h2 style="color:#7C3AED">Professional email account</h2>
          <p>Hi ${user.fullName},</p>
          <p>Your MernCrest business email has been created.</p>
          <table style="width:100%;font-size:14px;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b">Email</td><td><strong>${email}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Password</td><td><code>${password}</code></td></tr>
            <tr><td style="padding:6px 0;color:#64748b">SMTP</td><td>${hosts.smtpHost}:${hosts.smtpPort}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">IMAP</td><td>${hosts.imapHost}:${hosts.imapPort}</td></tr>
          </table>
          <p style="font-size:13px;color:#64748b">Please change your password after first login.</p>
          <p style="color:#64748b;font-size:12px;margin-top:24px">Powered by MERNcrest Solutions (Pvt) Ltd — merncrest.lk</p>
        </div>`,
    });
  }

  return { mailbox, password, created: true };
}

export async function listClientMailboxes(userId: string) {
  return prisma.businessMailbox.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      domain: true,
      status: true,
      smtpHost: true,
      smtpPort: true,
      imapHost: true,
      imapPort: true,
      provisionedAt: true,
      createdAt: true,
    },
  });
}
