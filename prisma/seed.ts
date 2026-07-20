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
      profile: {
        create: {
          city: "Colombo",
          country: "Sri Lanka",
          customerCode: "MC-DEMO01",
          phone: "94770000001",
          whatsapp: "94770000001",
          preferredLanguage: "en",
          timezone: "Asia/Colombo",
        },
      },
    },
  });

  // Ensure demo profile has WhatsApp + customer code (for existing DBs)
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@merncrest.lk" },
    include: { profile: true },
  });
  if (demoUser?.profile) {
    await prisma.customerProfile.update({
      where: { userId: demoUser.id },
      data: {
        customerCode: demoUser.profile.customerCode || "MC-DEMO01",
        phone: demoUser.profile.phone || "94770000001",
        whatsapp: demoUser.profile.whatsapp || "94770000001",
        preferredLanguage: demoUser.profile.preferredLanguage || "en",
      },
    });
  } else if (demoUser && !demoUser.profile) {
    await prisma.customerProfile.create({
      data: {
        userId: demoUser.id,
        customerCode: "MC-DEMO01",
        phone: "94770000001",
        whatsapp: "94770000001",
        city: "Colombo",
        country: "Sri Lanka",
      },
    });
  }

  const ownerProfile = await prisma.user.findUnique({ where: { email: "owner@merncrest.lk" } });
  if (ownerProfile) {
    await prisma.customerProfile.upsert({
      where: { userId: ownerProfile.id },
      update: {},
      create: {
        userId: ownerProfile.id,
        customerCode: "MC-OWNER1",
        city: "Colombo",
        country: "Sri Lanka",
      },
    });
  }

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

  // —— Reseller providers + pricing margins ——
  // Priority: Namecheap (gTLD) + DomainLK (.lk) first; mocks remain for hosting/dev.
  const providerDefs = [
    {
      code: "namecheap",
      name: "Namecheap",
      providerType: "DOMAIN",
      priority: 5,
      apiUrl: process.env.NAMECHEAP_API_URL || null,
      apiKey: process.env.NAMECHEAP_API_KEY || null,
      apiSecret: process.env.NAMECHEAP_API_USER || null,
      supportedServices: JSON.stringify(["domains"]),
      defaultMarginCents: 0,
      notes:
        "International domains (gTLD). Set NAMECHEAP_API_KEY / NAMECHEAP_API_USER / NAMECHEAP_CLIENT_IP. Without keys → search mock + register PENDING.",
    },
    {
      code: "domainlk",
      name: "DomainLK",
      providerType: "DOMAIN",
      priority: 6,
      apiUrl: process.env.DOMAINLK_API_URL || null,
      apiKey: process.env.DOMAINLK_API_KEY || null,
      apiSecret: process.env.DOMAINLK_API_SECRET || null,
      supportedServices: JSON.stringify(["domains"]),
      defaultMarginCents: 0,
      notes:
        ".lk ccTLD reseller API. Set DOMAINLK_API_URL + DOMAINLK_API_KEY after registrar partnership. Without keys → .lk search mock + register PENDING.",
    },
    {
      code: "provider-a",
      name: "Provider A (Mock)",
      providerType: "MULTI",
      priority: 50,
      apiUrl: "https://api.provider-a.example",
      apiKey: "demo-key-a",
      apiSecret: "demo-secret-a",
      supportedServices: JSON.stringify([
        "domains",
        "hosting",
        "vps",
        "ssl",
        "email",
        "cloud",
      ]),
      defaultMarginCents: 0,
      notes: "Dev/demo multi-service mock — not for production domains",
    },
    {
      code: "provider-b",
      name: "Provider B (Hosting Mock)",
      providerType: "HOSTING",
      priority: 60,
      apiUrl: "https://api.provider-b.example",
      apiKey: "demo-key-b",
      apiSecret: "demo-secret-b",
      supportedServices: JSON.stringify(["hosting", "vps", "ssl"]),
      defaultMarginCents: 0,
      notes: "Hosting / VPS specialist (mock API)",
    },
    {
      code: "provider-c",
      name: "Provider C (Email Mock)",
      providerType: "EMAIL",
      priority: 70,
      apiUrl: "https://api.provider-c.example",
      apiKey: "demo-key-c",
      apiSecret: "demo-secret-c",
      supportedServices: JSON.stringify(["email", "ssl", "cloud"]),
      defaultMarginCents: 0,
      notes: "Email / SSL / cloud specialist (mock API)",
    },
  ];

  for (const pd of providerDefs) {
    await prisma.provider.upsert({
      where: { code: pd.code },
      update: {
        name: pd.name,
        providerType: pd.providerType,
        priority: pd.priority,
        apiUrl: pd.apiUrl,
        apiKey: pd.apiKey,
        apiSecret: pd.apiSecret,
        supportedServices: pd.supportedServices,
        status: "ACTIVE",
        notes: pd.notes,
      },
      create: {
        ...pd,
        status: "ACTIVE",
        syncStatus: "IDLE",
      },
    });
  }

  const defaultMargins = [
    { category: "domains", marginCents: 30000, marginPercent: 0 },
    { category: "hosting", marginCents: 300000, marginPercent: 0 },
    { category: "vps", marginCents: 1000000, marginPercent: 0 },
    { category: "ssl", marginCents: 100000, marginPercent: 0 },
    { category: "email", marginCents: 50000, marginPercent: 0 },
    { category: "cloud", marginCents: 1000000, marginPercent: 0 },
  ];
  for (const m of defaultMargins) {
    await prisma.pricingMargin.upsert({
      where: { category: m.category },
      update: { marginCents: m.marginCents, marginPercent: m.marginPercent },
      create: m,
    });
  }

  const primaryProvider = await prisma.provider.findUnique({ where: { code: "provider-a" } });
  if (primaryProvider) {
    const marginByCat: Record<string, number> = Object.fromEntries(
      defaultMargins.map((m) => [m.category, m.marginCents])
    );
    const resellerCategories = ["domains", "hosting", "vps", "ssl", "email", "cloud", "security"];
    const products = await prisma.product.findMany({
      where: { category: { in: resellerCategories } },
    });
    for (const prod of products) {
      const catKey =
        prod.category === "security" ? "ssl" : prod.category === "vps" ? "vps" : prod.category;
      const margin = marginByCat[catKey] ?? marginByCat.hosting ?? 0;
      const providerPriceCents = Math.max(0, prod.priceCents - margin);
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          providerId: primaryProvider.id,
          providerProductId: prod.slug,
          providerPriceCents,
          lastSyncedAt: new Date(),
        },
      });
    }
    await prisma.provider.update({
      where: { id: primaryProvider.id },
      data: { syncStatus: "SUCCESS", lastSyncedAt: new Date() },
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

  const demo = await prisma.user.findUnique({ where: { email: "demo@merncrest.lk" } });
  const owner = await prisma.user.findUnique({ where: { email: "owner@merncrest.lk" } });

  if (demo && owner) {
    const existingTicket = await prisma.ticket.findFirst({
      where: { userId: demo.id, subject: "Demo: Hosting activation question" },
    });
    if (!existingTicket) {
      await prisma.ticket.create({
        data: {
          ticketNumber: "TKT-SEED-001",
          userId: demo.id,
          subject: "Demo: Hosting activation question",
          department: "HOSTING",
          priority: "MEDIUM",
          channel: "PORTAL",
          status: "OPEN",
          messages: {
            create: [
              {
                authorId: demo.id,
                authorName: demo.fullName,
                authorRole: "CUSTOMER",
                body: "How long after Demo pay until my hosting shows as ACTIVE?",
              },
              {
                authorId: owner.id,
                authorName: owner.fullName,
                authorRole: "STAFF",
                body: "Usually immediate after payment confirmation. Check Portal → Hosting.",
              },
            ],
          },
        },
      });
    }

    await prisma.notification.deleteMany({
      where: { userId: demo.id, title: { in: ["Welcome to MernCrest Portal", "Support tip"] } },
    });
    await prisma.notification.createMany({
      data: [
        {
          userId: demo.id,
          title: "Welcome to MernCrest Portal",
          body: "Manage domains, hosting, billing, and support from one place.",
          category: "SYSTEM",
          href: "/portal",
        },
        {
          userId: demo.id,
          title: "Support tip",
          body: "Use live chat or open a ticket — both sync to our CRM.",
          category: "SUPPORT",
          href: "/portal/tickets",
        },
      ],
    });

    const leadCount = await prisma.crmLead.count();
    if (leadCount === 0) {
      await prisma.crmLead.create({
        data: {
          fullName: "Nimal Perera",
          email: "nimal@example.lk",
          phone: "+94771234567",
          company: "Perera Traders",
          interest: "Business Hosting + .lk domain",
          source: "WEBSITE",
          stage: "MEETING",
          valueCents: 1500000,
          ownerId: owner.id,
          activities: {
            create: [
              { userId: owner.id, type: "NOTE", body: "Interested in annual billing." },
              { userId: owner.id, type: "WHATSAPP", body: "Sent package comparison." },
            ],
          },
        },
      });
      await prisma.crmLead.create({
        data: {
          fullName: "Ayesha Fernando",
          email: "ayesha@startup.lk",
          phone: "+94779876543",
          company: "Startup LK",
          interest: "AWS Managed Hosting",
          source: "LIVE_CHAT",
          stage: "NEW",
          valueCents: 15000000,
          ownerId: owner.id,
        },
      });
    }
  }

  // —— Part 05 ERP seed ——
  await prisma.user.upsert({
    where: { email: "staff@merncrest.lk" },
    update: {},
    create: {
      email: "staff@merncrest.lk",
      fullName: "Support Staff",
      company: "MernCrest Solutions",
      passwordHash,
      role: "STAFF",
      emailVerifiedAt: new Date(),
    },
  });
  const staffUser = await prisma.user.findUnique({ where: { email: "staff@merncrest.lk" } });

  const depts = [
    { code: "SALES", name: "Sales", description: "Sales & account management" },
    { code: "TECH", name: "Technical", description: "Hosting & infrastructure" },
    { code: "FIN", name: "Finance", description: "Billing & finance" },
    { code: "HR", name: "Human Resources", description: "People operations" },
  ];
  for (const d of depts) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: d,
    });
  }

  if (staffUser && owner) {
    const tech = await prisma.department.findUnique({ where: { code: "TECH" } });
    const empCount = await prisma.employee.count();
    if (empCount === 0 && tech) {
      await prisma.employee.create({
        data: {
          employeeCode: "EMP-SEED-001",
          userId: staffUser.id,
          departmentId: tech.id,
          fullName: staffUser.fullName,
          email: staffUser.email,
          jobTitle: "Support Engineer",
          orgRole: "ENGINEER",
          employmentType: "FULL_TIME",
          salaryCents: 12000000,
          status: "ACTIVE",
        },
      });
      await prisma.employee.create({
        data: {
          employeeCode: "EMP-SEED-002",
          departmentId: tech.id,
          fullName: "Kasun Silva",
          email: "kasun@merncrest.lk",
          jobTitle: "Systems Admin",
          orgRole: "ENGINEER",
          salaryCents: 15000000,
          status: "ACTIVE",
        },
      });
    }

    // Update existing staff employee orgRole if present
    await prisma.employee.updateMany({
      where: { userId: staffUser.id },
      data: { orgRole: "ENGINEER" },
    });

    await prisma.staffPermission.upsert({
      where: {
        userId_permission: { userId: staffUser.id, permission: "erp.finance.view" },
      },
      update: {},
      create: { userId: staffUser.id, permission: "erp.finance.view" },
    });
    for (const p of ["erp.iot.view", "erp.esm.view", "erp.dms.view", "erp.ai.view"] as const) {
      await prisma.staffPermission.upsert({
        where: { userId_permission: { userId: staffUser.id, permission: p } },
        update: {},
        create: { userId: staffUser.id, permission: p },
      });
    }

    if ((await prisma.erpProject.count()) === 0) {
      await prisma.erpProject.create({
        data: {
          projectCode: "PRJ-SEED-001",
          name: "Customer Portal Phase 2",
          description: "Internal delivery of portal enhancements",
          departmentId: tech?.id,
          status: "ACTIVE",
          budgetCents: 250000000,
          members: { create: { userId: owner.id, role: "LEAD" } },
          tasks: {
            create: [
              { title: "ERP HR module", status: "DONE", assigneeId: owner.id },
              { title: "Finance ledger UI", status: "IN_PROGRESS", assigneeId: staffUser.id },
              { title: "FSM work orders", status: "TODO" },
            ],
          },
        },
      });
    }

    if ((await prisma.financeEntry.count()) === 0) {
      await prisma.financeEntry.createMany({
        data: [
          {
            entryNumber: "FIN-SEED-001",
            type: "INCOME",
            category: "Hosting",
            description: "Monthly hosting collections",
            amountCents: 85000000,
            createdById: owner.id,
          },
          {
            entryNumber: "FIN-SEED-002",
            type: "EXPENSE",
            category: "Infrastructure",
            description: "AWS / datacenter costs",
            amountCents: 22000000,
            createdById: owner.id,
          },
          {
            entryNumber: "FIN-SEED-003",
            type: "EXPENSE",
            category: "Payroll",
            description: "Staff salaries (sample)",
            amountCents: 45000000,
            createdById: owner.id,
          },
        ],
      });
    }

    if ((await prisma.asset.count()) === 0) {
      await prisma.asset.createMany({
        data: [
          {
            assetCode: "AST-SEED-001",
            name: "Dell R740 Server",
            category: "IT Hardware",
            status: "ASSIGNED",
            location: "Colombo DC",
            purchaseCents: 85000000,
            assignedTo: "Systems",
          },
          {
            assetCode: "AST-SEED-002",
            name: "MacBook Pro 14",
            category: "IT Hardware",
            status: "ASSIGNED",
            location: "HQ",
            purchaseCents: 45000000,
            assignedTo: staffUser.fullName,
          },
        ],
      });
    }

    if ((await prisma.inventoryItem.count()) === 0) {
      await prisma.inventoryItem.createMany({
        data: [
          { sku: "CBL-CAT6", name: "Cat6 Cable (box)", category: "Networking", quantity: 12, reorderLevel: 5, unitCostCents: 150000 },
          { sku: "SSD-1TB", name: "1TB NVMe SSD", category: "Storage", quantity: 3, reorderLevel: 4, unitCostCents: 3500000 },
          { sku: "LIC-CPANEL", name: "cPanel license credit", category: "Software", quantity: 20, reorderLevel: 5, unitCostCents: 250000 },
        ],
      });
    }

    if ((await prisma.workOrder.count()) === 0) {
      await prisma.workOrder.create({
        data: {
          workNumber: "WO-SEED-001",
          title: "On-site router replacement — Demo Co",
          description: "Replace CPE and verify failover",
          status: "OPEN",
          priority: "HIGH",
          assetCode: "AST-SEED-001",
          assigneeId: staffUser.id,
          latitude: 6.9271,
          longitude: 79.8612,
        },
      });
    }

    if ((await prisma.vendor.count()) === 0) {
      const vendor = await prisma.vendor.create({
        data: {
          vendorCode: "VEN-SEED-001",
          name: "Lanka IT Supplies",
          email: "sales@lankait.lk",
          category: "Hardware",
          ownerId: owner.id,
        },
      });
      await prisma.purchaseOrder.create({
        data: {
          poNumber: "PO-SEED-001",
          vendorId: vendor.id,
          description: "SSD stock replenishment",
          amountCents: 35000000,
          status: "SUBMITTED",
        },
      });
    }

    if ((await prisma.warehouse.count()) === 0) {
      await prisma.warehouse.create({
        data: { code: "WH-CMB", name: "Colombo Main Warehouse", location: "Colombo" },
      });
    }

    if ((await prisma.serviceCatalogItem.count()) === 0) {
      await prisma.serviceCatalogItem.createMany({
        data: [
          { code: "SVC-HOST", name: "Hosting incident", category: "Technical", slaHours: 4 },
          { code: "SVC-ACCESS", name: "Access request", category: "Request", slaHours: 24 },
          { code: "SVC-CHANGE", name: "Standard change", category: "Change", slaHours: 72 },
        ],
      });
    }

    if ((await prisma.iotDevice.count()) === 0) {
      const device = await prisma.iotDevice.create({
        data: {
          deviceCode: "IOT-SEED-001",
          name: "Rack A Temperature",
          location: "Colombo DC",
          status: "ONLINE",
          healthScore: 92,
          lastSeenAt: new Date(),
        },
      });
      await prisma.iotReading.create({
        data: { deviceId: device.id, metric: "temperature", value: 28.5, unit: "C" },
      });
    }

    if ((await prisma.document.count()) === 0) {
      await prisma.document.create({
        data: {
          docNumber: "DOC-SEED-001",
          title: "Employee Handbook 2026",
          category: "HR Policy",
          status: "APPROVED",
          version: 1,
          uploaderId: owner.id,
        },
      });
    }

    if ((await prisma.bom.count()) === 0) {
      const bom = await prisma.bom.create({
        data: {
          bomCode: "BOM-SEED-001",
          productName: "Managed Edge Appliance",
          lines: {
            create: [
              { componentSku: "SSD-1TB", quantity: 1 },
              { componentSku: "CBL-CAT6", quantity: 4 },
            ],
          },
        },
      });
      await prisma.productionOrder.create({
        data: {
          orderNumber: "MO-SEED-001",
          bomId: bom.id,
          productName: "Managed Edge Appliance",
          quantity: 5,
          status: "PLANNED",
        },
      });
    }
  }

  // —— Part 03 portal announcements + downloads ——
  const announcementExists = await prisma.announcement.findFirst({
    where: { title: "Welcome to your Customer Portal" },
  });
  if (!announcementExists) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to your Customer Portal",
        body: "Manage domains, hosting, invoices, and support from one workspace. Domains and hosting are activated via our reseller provider network after payment verification.",
        tone: "INFO",
        href: "/portal/services",
        active: true,
      },
    });
    await prisma.announcement.create({
      data: {
        title: "Bank transfer payments",
        body: "Submit your payment reference under Billing. An admin verifies and provisions services through the Provider API.",
        tone: "PROMO",
        href: "/portal/invoices",
        active: true,
      },
    });
  }

  const manualExists = await prisma.customerDownload.findFirst({
    where: { title: "Hosting Buyer Guide", userId: null },
  });
  if (!manualExists) {
    await prisma.customerDownload.createMany({
      data: [
        {
          userId: null,
          title: "Hosting Buyer Guide",
          description: "Choose shared, VPS, or cloud packages from our marketplace.",
          category: "MANUAL",
          fileUrl: "/downloads",
          fileType: "PDF",
        },
        {
          userId: null,
          title: "Service Catalog",
          description: "Enterprise software, ERP, CRM, and marketplace offerings.",
          category: "DOCUMENT",
          fileUrl: "/downloads",
          fileType: "PDF",
        },
      ],
    });
  }

  // Part 05 — primary organization + Colombo HO + COA defaults
  const org = await prisma.organization.upsert({
    where: { code: "MCS" },
    update: { name: "MernCrest Solutions (Pvt) Ltd", isPrimary: true, status: "ACTIVE" },
    create: {
      code: "MCS",
      name: "MernCrest Solutions (Pvt) Ltd",
      legalName: "MernCrest Solutions (Private) Limited",
      country: "Sri Lanka",
      email: "hello@merncrest.lk",
      isPrimary: true,
      status: "ACTIVE",
    },
  });
  await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "CMB-HO" } },
    update: { name: "Colombo Head Office", isHeadOffice: true, city: "Colombo" },
    create: {
      organizationId: org.id,
      code: "CMB-HO",
      name: "Colombo Head Office",
      city: "Colombo",
      isHeadOffice: true,
      status: "ACTIVE",
    },
  });

  const coaDefaults = [
    { code: "1000", name: "Cash & Bank", type: "ASSET" },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" },
    { code: "1200", name: "Inventory", type: "ASSET" },
    { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
    { code: "3000", name: "Owner Equity", type: "EQUITY" },
    { code: "4000", name: "Sales Revenue", type: "REVENUE" },
    { code: "4100", name: "Service Revenue", type: "REVENUE" },
    { code: "5000", name: "Cost of Sales", type: "EXPENSE" },
    { code: "5100", name: "Operating Expenses", type: "EXPENSE" },
    { code: "5200", name: "Payroll Expenses", type: "EXPENSE" },
  ];
  for (const a of coaDefaults) {
    await prisma.chartOfAccount.upsert({
      where: { code: a.code },
      update: { name: a.name, type: a.type, active: true },
      create: { ...a, active: true },
    });
  }

  const staffEmp = await prisma.employee.findFirst({
    where: { email: "staff@merncrest.lk" },
  });
  if (staffEmp && (await prisma.salarySlip.count({ where: { employeeId: staffEmp.id } })) === 0) {
    await prisma.salarySlip.create({
      data: {
        slipNumber: "SLIP-SEED-001",
        employeeId: staffEmp.id,
        periodLabel: "2026-06",
        grossCents: 12000000,
        deductionsCents: 1200000,
        netCents: 10800000,
        currency: "LKR",
        status: "ISSUED",
      },
    });
  }

  console.log("Seeded users +", catalog.length, "products +", coupons.length, "coupons + CRM/ERP samples");
  console.log("  OWNER: owner@merncrest.lk / ChangeMe123!");
  console.log("  STAFF: staff@merncrest.lk / ChangeMe123!  → /staff + /admin/erp");
  console.log("  CUSTOMER: demo@merncrest.lk / ChangeMe123!");
  console.log("  Coupons: WELCOME10 (10%), SAVE20 (Rs. 2,000 off)");
  console.log("  Org: MCS · Branch CMB-HO · COA seeded · sample salary slip");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
