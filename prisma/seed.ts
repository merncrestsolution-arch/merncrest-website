import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const catalog = [
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
    description: "Register a .lk domain for 1 year.",
    category: "domains",
    priceCents: 450000,
    billingPeriod: "YEARLY",
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "shared-hosting-starter",
    name: "Shared Hosting — Starter",
    description: "cPanel shared hosting with SSL and daily backups.",
    category: "hosting",
    priceCents: 990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "vps-hosting-basic",
    name: "VPS Hosting — Basic",
    description: "2 vCPU, 4GB RAM managed VPS on SSD storage.",
    category: "hosting",
    priceCents: 7990000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "business-website",
    name: "Business Website Package",
    description: "Mobile-responsive business website with CMS setup.",
    category: "software",
    priceCents: 7500000,
    billingPeriod: "ONCE",
    featured: true,
    sortOrder: 5,
  },
  {
    slug: "ssl-certificate",
    name: "SSL Certificate",
    description: "Standard SSL for one domain with installation support.",
    category: "security",
    priceCents: 350000,
    billingPeriod: "YEARLY",
    featured: false,
    sortOrder: 6,
  },
  {
    slug: "professional-email",
    name: "Professional Email (5 mailboxes)",
    description: "Branded email for your domain with spam filtering.",
    category: "email",
    priceCents: 150000,
    billingPeriod: "MONTHLY",
    featured: false,
    sortOrder: 7,
  },
  {
    slug: "growth-plan",
    name: "Growth Plan Subscription",
    description: "Hosting, portal access, priority support, and monthly report.",
    category: "software",
    priceCents: 2990000,
    billingPeriod: "MONTHLY",
    featured: true,
    sortOrder: 8,
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

  console.log("Seeded users +", catalog.length, "catalog products");
  console.log("  OWNER: owner@merncrest.lk / ChangeMe123!");
  console.log("  CUSTOMER: demo@merncrest.lk / ChangeMe123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
