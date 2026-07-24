import { prisma } from "@/lib/db";
import { generateToken, hashPassword } from "@/lib/auth";
import { onCustomerRegistered } from "@/lib/crm/customer-hooks";
import { sendMailRaw } from "@/lib/mail";
import { writeAuditLog } from "@/lib/erp/audit";

export type CreateCustomerInput = {
  fullName: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  password?: string | null;
  sendWelcomeEmail?: boolean;
  createdById?: string;
};

function generateTempPassword() {
  return `MC-${generateToken(4).slice(0, 8)}`;
}

function nextCustomerCode() {
  return `MC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function createCustomerAccount(input: CreateCustomerInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A client with this email already exists");
  }

  const tempPassword = input.password?.trim() || generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const customerCode = nextCustomerCode();

  const user = await prisma.user.create({
    data: {
      email,
      fullName: input.fullName.trim(),
      company: input.company?.trim() || null,
      passwordHash,
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          customerCode,
          phone: input.phone?.trim() || null,
          whatsapp: input.phone?.trim() || null,
          country: "Sri Lanka",
          preferredLanguage: "en",
          timezone: "Asia/Colombo",
        },
      },
    },
    include: { profile: true },
  });

  await onCustomerRegistered({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    company: user.company,
    phone: input.phone,
  });

  if (input.createdById) {
    void writeAuditLog({
      actorId: input.createdById,
      action: "CUSTOMER_CREATED",
      module: "CRM",
      entityType: "User",
      entityId: user.id,
      summary: `Client account created for ${user.email}`,
      meta: { email: user.email, customerCode },
    });
  }

  if (input.sendWelcomeEmail !== false) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://merncrest.lk";
    void sendMailRaw({
      to: user.email,
      subject: "Your MernCrest customer portal account",
      text: [
        `Hi ${user.fullName},`,
        "",
        "A MernCrest customer portal account has been created for you.",
        "",
        `Login: ${siteUrl}/en/login`,
        `Email: ${user.email}`,
        `Temporary password: ${tempPassword}`,
        "",
        "Please change your password after your first login.",
        "",
        `Customer code: ${customerCode}`,
      ].join("\n"),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h1 style="color:#7C3AED">Welcome to MernCrest</h1>
          <p>Hi <strong>${user.fullName}</strong>,</p>
          <p>Your customer portal account is ready.</p>
          <p><strong>Customer code:</strong> ${customerCode}</p>
          <p><strong>Email:</strong> ${user.email}<br/>
          <strong>Temporary password:</strong> ${tempPassword}</p>
          <p><a href="${siteUrl}/en/login" style="display:inline-block;background:#14B8A6;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Sign in to portal</a></p>
          <p style="color:#64748b;font-size:13px">Please change your password after your first login.</p>
        </div>`,
    });
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      company: user.company,
      customerCode: user.profile?.customerCode,
    },
    tempPassword: input.password ? undefined : tempPassword,
  };
}
