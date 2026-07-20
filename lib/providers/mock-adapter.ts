import type {
  ProviderCredentials,
  ProviderDomainResult,
  ProviderPackage,
  ProvisionDomainInput,
  ProvisionHostingInput,
  ProvisionResult,
  ResellerProviderAdapter,
} from "@/lib/providers/types";

/** Wholesale (provider) TLD costs — selling price applied by Pricing Engine. */
const PROVIDER_TLD_COST: Record<
  string,
  { register: number; renew: number; transfer: number; premium?: boolean }
> = {
  lk: { register: 160000, renew: 160000, transfer: 140000 },
  "com.lk": { register: 140000, renew: 140000, transfer: 120000 },
  "org.lk": { register: 140000, renew: 140000, transfer: 120000 },
  "edu.lk": { register: 110000, renew: 110000, transfer: 100000 },
  "sch.lk": { register: 100000, renew: 100000, transfer: 90000 },
  "ngo.lk": { register: 130000, renew: 130000, transfer: 110000 },
  "hotel.lk": { register: 150000, renew: 150000, transfer: 130000 },
  "soc.lk": { register: 130000, renew: 130000, transfer: 110000 },
  com: { register: 190000, renew: 200000, transfer: 170000 },
  net: { register: 200000, renew: 210000, transfer: 180000 },
  org: { register: 200000, renew: 210000, transfer: 180000 },
  biz: { register: 190000, renew: 200000, transfer: 170000 },
  info: { register: 160000, renew: 170000, transfer: 150000 },
  xyz: { register: 120000, renew: 130000, transfer: 110000 },
  co: { register: 320000, renew: 340000, transfer: 300000 },
  io: { register: 450000, renew: 480000, transfer: 420000 },
  app: { register: 350000, renew: 370000, transfer: 330000 },
  dev: { register: 350000, renew: 370000, transfer: 330000 },
  online: { register: 140000, renew: 150000, transfer: 130000 },
  store: { register: 250000, renew: 270000, transfer: 230000 },
  tech: { register: 220000, renew: 240000, transfer: 200000 },
};

const RESERVED = new Set([
  "google",
  "facebook",
  "microsoft",
  "apple",
  "amazon",
  "merncrest",
  "localhost",
  "example",
  "gov",
]);

const SUGGESTION_SUFFIXES = ["online", "lk", "app", "tech", "store", "hq", "pro"];

const MOCK_PACKAGES: ProviderPackage[] = [
  {
    providerProductId: "pkg-shared-starter",
    name: "Shared Hosting — Starter",
    description: "1 CPU · 512MB RAM · 10GB SSD · Unlimited bandwidth · Free SSL · Daily backups.",
    category: "hosting",
    providerPriceCents: 690000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 10240, bandwidthGb: 100, ramMb: 512, cpu: 1 },
  },
  {
    providerProductId: "pkg-business",
    name: "Business Hosting",
    description: "2 CPU · 2GB RAM · 50GB SSD · Free migration · Priority support · cPanel.",
    category: "hosting",
    providerPriceCents: 2490000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 51200, bandwidthGb: 500, ramMb: 2048, cpu: 2 },
  },
  {
    providerProductId: "pkg-wordpress",
    name: "WordPress Hosting",
    description: "Optimized WordPress stack · Staging · Auto updates · Free SSL · Daily backups.",
    category: "hosting",
    providerPriceCents: 1990000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 25600, bandwidthGb: 300, ramMb: 1024, cpu: 2 },
  },
  {
    providerProductId: "pkg-cpanel",
    name: "cPanel Hosting",
    description: "Full cPanel · Softaculous · Email · MySQL · Free SSL · 24/7 support.",
    category: "hosting",
    providerPriceCents: 1590000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 20480, bandwidthGb: 200, ramMb: 1024, cpu: 1 },
  },
  {
    providerProductId: "pkg-cloud",
    name: "Cloud Hosting",
    description: "Scalable cloud · Auto scaling · SSD · Load-balanced · Monitoring.",
    category: "cloud",
    providerPriceCents: 3990000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 102400, bandwidthGb: 2000, ramMb: 4096, cpu: 4 },
  },
  {
    providerProductId: "pkg-vps-basic",
    name: "Linux VPS — Basic",
    description: "2 vCPU · 4GB RAM · 80GB SSD · Root access · Optional managed support.",
    category: "vps",
    providerPriceCents: 6990000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 81920, bandwidthGb: 1000, ramMb: 4096, cpu: 2 },
  },
  {
    providerProductId: "pkg-vps-windows",
    name: "Windows VPS",
    description: "2 vCPU · 4GB RAM · Windows Server · RDP · Managed option available.",
    category: "vps",
    providerPriceCents: 8990000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
    specs: { diskMb: 81920, bandwidthGb: 1000, ramMb: 4096, cpu: 2 },
  },
  {
    providerProductId: "pkg-ssl-dv",
    name: "DV SSL Certificate",
    description: "Domain Validation SSL with installation support.",
    category: "ssl",
    providerPriceCents: 250000,
    currency: "LKR",
    billingPeriod: "YEARLY",
  },
  {
    providerProductId: "pkg-ssl-wildcard",
    name: "Wildcard SSL",
    description: "Secure unlimited subdomains with one certificate.",
    category: "ssl",
    providerPriceCents: 2000000,
    currency: "LKR",
    billingPeriod: "YEARLY",
  },
  {
    providerProductId: "pkg-email-pro",
    name: "Professional Email (5 mailboxes)",
    description: "Branded email · Spam protection · Webmail · Mobile setup.",
    category: "email",
    providerPriceCents: 100000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
  },
  {
    providerProductId: "pkg-gws",
    name: "Google Workspace Starter",
    description: "Business email on Google · Drive · Meet · Admin console setup.",
    category: "email",
    providerPriceCents: 1500000,
    currency: "LKR",
    billingPeriod: "MONTHLY",
  },
];

function normalizeDomainInput(input: string) {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const parts = cleaned.split(".").filter(Boolean);
  if (parts.length < 2) {
    return { sld: parts[0] || "", tld: "com", fqdn: parts[0] ? `${parts[0]}.com` : "" };
  }
  const knownMulti = Object.keys(PROVIDER_TLD_COST)
    .filter((t) => t.includes("."))
    .sort((a, b) => b.length - a.length);
  for (const multi of knownMulti) {
    if (cleaned.endsWith(`.${multi}`) || cleaned === multi) {
      const sld = cleaned.slice(0, -(multi.length + 1));
      return { sld, tld: multi, fqdn: sld ? `${sld}.${multi}` : multi };
    }
  }
  const tld = parts.slice(1).join(".");
  const sld = parts[0];
  return { sld, tld, fqdn: `${sld}.${tld}` };
}

function buildResult(sld: string, tld: string): ProviderDomainResult {
  const pricing = PROVIDER_TLD_COST[tld] ?? {
    register: 200000,
    renew: 210000,
    transfer: 180000,
  };
  const available =
    !RESERVED.has(sld) &&
    !/[^a-z0-9-]/i.test(sld) &&
    !sld.startsWith("-") &&
    !sld.endsWith("-");

  return {
    domain: `${sld}.${tld}`,
    sld,
    tld,
    available,
    premium: Boolean(pricing.premium),
    providerPriceCents: pricing.register,
    renewProviderCents: pricing.renew,
    transferProviderCents: pricing.transfer,
    currency: "LKR",
  };
}

/**
 * Mock reseller adapter simulating a third-party Provider API.
 * Swap for real HTTP adapters (Provider A/B/C) without changing callers.
 */
export class MockResellerProvider implements ResellerProviderAdapter {
  readonly code: string;

  constructor(private readonly creds: ProviderCredentials) {
    this.code = creds.code;
  }

  async searchDomains(query: string) {
    const { sld, tld, fqdn } = normalizeDomainInput(query);
    if (!sld || sld.length < 2) {
      return {
        error: "Enter at least 2 characters",
        fqdn,
        sld,
        results: [] as ProviderDomainResult[],
        suggestions: [] as ProviderDomainResult[],
      };
    }

    const allTlds = Object.keys(PROVIDER_TLD_COST);
    const preferred = tld && PROVIDER_TLD_COST[tld] ? tld : "com";
    const tlds = [preferred, ...allTlds.filter((t) => t !== preferred)].slice(0, 12);
    const results = tlds.map((t) => buildResult(sld, t));

    const primaryUnavailable = results[0] && !results[0].available;
    const suggestions = SUGGESTION_SUFFIXES.filter((sfx) => sfx !== sld)
      .slice(0, primaryUnavailable ? 6 : 4)
      .map((sfx) => buildResult(`${sld}${sfx}`, preferred === "lk" ? "lk" : "com"))
      .filter((r) => r.available);

    return { fqdn, sld, results, suggestions };
  }

  async listPackages() {
    // Slightly vary catalog by provider code for multi-provider demos
    if (this.code.includes("b")) {
      return MOCK_PACKAGES.filter((p) =>
        ["hosting", "vps", "ssl"].includes(p.category)
      );
    }
    if (this.code.includes("c")) {
      return MOCK_PACKAGES.filter((p) =>
        ["email", "ssl", "cloud"].includes(p.category)
      );
    }
    return MOCK_PACKAGES;
  }

  async provisionDomain(input: ProvisionDomainInput): Promise<ProvisionResult> {
    // Mock = local/dev only. Mark ACTIVE so demos work; live adapters use PENDING when offline.
    return {
      success: true,
      status: "ACTIVE",
      providerRef: `${this.code}-dom-${Date.now()}`,
      nameservers: ["ns1.provider.example", "ns2.provider.example"],
      message: `Domain ${input.domain} ${input.action}ed via ${this.creds.name} (mock)`,
    };
  }

  async provisionHosting(input: ProvisionHostingInput): Promise<ProvisionResult> {
    const pkg = MOCK_PACKAGES.find(
      (p) =>
        p.providerProductId === input.providerProductId ||
        p.providerProductId === input.planCode ||
        input.planCode.includes(p.providerProductId)
    );
    const specs = pkg?.specs;
    return {
      success: true,
      status: "ACTIVE",
      providerRef: `${this.code}-host-${Date.now()}`,
      panelUrl: this.creds.apiUrl
        ? `${this.creds.apiUrl.replace(/\/$/, "")}/panel`
        : "https://panel.provider.example",
      message: `Hosting ${input.label} provisioned via ${this.creds.name} (mock)`,
      specs: {
        diskMb: typeof specs?.diskMb === "number" ? specs.diskMb : 10240,
        bandwidthGb: typeof specs?.bandwidthGb === "number" ? specs.bandwidthGb : 100,
        ramMb: typeof specs?.ramMb === "number" ? specs.ramMb : 512,
      },
    };
  }
}

/** Exported for legacy domain registry compatibility */
export { PROVIDER_TLD_COST, normalizeDomainInput };
