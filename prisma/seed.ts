import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const catalog = [
  // Domains
  {
    slug: "domain-com-registration",
    name: ".com Domain Registration",
    description: "Register a .com domain for 1 year with DNS management.",
    category: "domains",
    priceCents: 250000,
    billingPeriod: "YEARLY",
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "domain-lk-registration",
    name: ".lk Domain Registration",
    description: "Register a .lk domain for 1 year (Sri Lanka).",
    category: "domains",
    priceCents: 590000,
    billingPeriod: "YEARLY",
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "domain-com-lk-registration",
    name: ".com.lk Domain Registration",
    description: "Register a .com.lk domain for 1 year.",
    category: "domains",
    priceCents: 490000,
    billingPeriod: "YEARLY",
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "domain-io-registration",
    name: ".io Domain Registration",
    description: "Register a .io domain for 1 year.",
    category: "domains",
    priceCents: 650000,
    billingPeriod: "YEARLY",
    featured: false,
    sortOrder: 4,
  },
  // Hosting
  {
    slug: "shared-hosting-starter",
    name: "Shared Hosting — Starter",
    description: "1 CPU · 512MB RAM · 10GB SSD · Unlimited bandwidth · Free SSL · Daily backups.",
    category: "hosting",
    priceCents: 990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 10,
  },
  {
    slug: "business-hosting",
    name: "Business Hosting",
    description: "2 CPU · 2GB RAM · 50GB SSD · Free migration · Priority support · cPanel.",
    category: "hosting",
    priceCents: 2990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 11,
  },
  {
    slug: "wordpress-hosting",
    name: "WordPress Hosting",
    description: "Optimized WordPress stack · Staging · Auto updates · Free SSL · Daily backups.",
    category: "hosting",
    priceCents: 2490000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 12,
  },
  {
    slug: "cpanel-hosting",
    name: "cPanel Hosting",
    description: "Full cPanel · Softaculous · Email · MySQL · Free SSL · 24/7 support.",
    category: "hosting",
    priceCents: 1990000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 13,
  },
  {
    slug: "cloud-hosting",
    name: "Cloud Hosting",
    description: "Scalable cloud · Auto scaling · SSD · Load-balanced · Monitoring.",
    category: "hosting",
    priceCents: 4990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 14,
  },
  {
    slug: "vps-hosting-basic",
    name: "Linux VPS — Basic",
    description: "2 vCPU · 4GB RAM · 80GB SSD · Root access · Optional managed support.",
    category: "hosting",
    priceCents: 7990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 15,
  },
  {
    slug: "vps-windows",
    name: "Windows VPS",
    description: "2 vCPU · 4GB RAM · Windows Server · RDP · Managed option available.",
    category: "hosting",
    priceCents: 9990000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 16,
  },
  {
    slug: "dedicated-server",
    name: "Dedicated Server",
    description: "Enterprise dedicated hardware · Full root · Custom RAID · 24/7 monitoring.",
    category: "hosting",
    priceCents: 45000000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 17,
  },
  {
    slug: "aws-managed-hosting",
    name: "AWS Managed Hosting",
    description: "Managed EC2/Lightsail · Monitoring · Backups · Cost optimization.",
    category: "cloud",
    priceCents: 15000000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 18,
  },
  // Add-ons
  {
    slug: "ssl-certificate",
    name: "DV SSL Certificate",
    description: "Domain Validation SSL with installation support.",
    category: "security",
    priceCents: 350000,
    billingPeriod: "YEARLY",
    featured: false,
    sortOrder: 20,
  },
  {
    slug: "ssl-wildcard",
    name: "Wildcard SSL",
    description: "Secure unlimited subdomains with one certificate.",
    category: "security",
    priceCents: 2500000,
    billingPeriod: "YEARLY",
    featured: false,
    sortOrder: 21,
  },
  {
    slug: "professional-email",
    name: "Professional Email (5 mailboxes)",
    description: "Branded email · Spam protection · Webmail · Mobile setup.",
    category: "email",
    priceCents: 150000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 22,
  },
  {
    slug: "google-workspace",
    name: "Google Workspace Starter",
    description: "Business email on Google · Drive · Meet · Admin console setup.",
    category: "email",
    priceCents: 1800000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 23,
  },
  {
    slug: "business-website",
    name: "Business Website Package",
    description: "Mobile-responsive business website with CMS setup.",
    category: "software",
    priceCents: 7500000,
    billingPeriod: "ONCE",
    featured: true,
    sortOrder: 30,
  },
  {
    slug: "growth-plan",
    name: "Growth Plan Subscription",
    description: "Hosting, portal access, priority support, and monthly report.",
    category: "software",
    priceCents: 2990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 31,
  },
];

const coupons = [
  {
    code: "WELCOME10",
    type: "PERCENT",
    value: 10,
    maxUses: 1000,
    minOrderCents: 100000,
    expiresAt: new Date("2027-12-31"),
  },
  {
    code: "SAVE20",
    type: "FIXED",
    value: 200000,
    maxUses: 500,
    minOrderCents: 500000,
    expiresAt: new Date("2027-06-30"),
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.user.upsert({
    where: { email: "owner@merncrest.lk" },
    update: {},
    create: {
      email: "owner@merncrest.lk",
      fullName: "Platform Owner",
      company: "MernCrest Solutions",
      passwordHash,
      role: "OWNER",
      emailVerifiedAt: new Date(),
      profile: { create: { city: "Colombo", country: "Sri Lanka" } },
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@merncrest.lk" },
    update: {},
    create: {
      email: "demo@merncrest.lk",
      fullName: "Demo Customer",
      company: "Demo Co",
      passwordHash,
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
      profile: { create: { city: "Colombo", country: "Sri Lanka" } },
    },
  });

  for (const p of catalog) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        category: p.category,
        priceCents: p.priceCents,
        billingPeriod: p.billingPeriod,
        featured: p.featured,
        sortOrder: p.sortOrder,
        active: true,
      },
      create: p,
    });
  }

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        type: c.type,
        value: c.value,
        maxUses: c.maxUses,
        minOrderCents: c.minOrderCents,
        expiresAt: c.expiresAt,
        active: true,
      },
      create: c,
    });
  }

  console.log("Seeded users +", catalog.length, "products +", coupons.length, "coupons");
  console.log("  OWNER: owner@merncrest.lk / ChangeMe123!");
  console.log("  CUSTOMER: demo@merncrest.lk / ChangeMe123!");
  console.log("  Coupons: WELCOME10 (10%), SAVE20 (Rs. 2,000 off)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
