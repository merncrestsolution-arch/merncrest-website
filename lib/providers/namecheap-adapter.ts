/**
 * Namecheap XML API adapter — international gTLDs (.com, .net, .org, …).
 * Docs: https://www.namecheap.com/support/api/intro/
 *
 * Without credentials, falls back to deterministic mock availability + wholesale table
 * so local/dev never hard-fails. Registration without live API queues as PENDING.
 */

import type {
  ProviderCredentials,
  ProviderDomainResult,
  ProviderPackage,
  ProvisionDomainInput,
  ProvisionHostingInput,
  ProvisionResult,
  ResellerProviderAdapter,
} from "@/lib/providers/types";
import {
  normalizeDomainInput,
} from "@/lib/providers/mock-adapter";
import { MockResellerProvider } from "@/lib/providers/mock-adapter";

const GTLD_LIST = [
  "com",
  "net",
  "org",
  "biz",
  "info",
  "xyz",
  "co",
  "io",
  "app",
  "dev",
  "online",
  "store",
  "tech",
];

const SUGGESTION_SUFFIXES = ["online", "app", "tech", "store", "hq", "pro"];

/** Approximate USD wholesale (cents) — Pricing Engine converts + locks FX at quote time */
const GTLD_USD_CENTS: Record<
  string,
  { register: number; renew: number; transfer: number }
> = {
  com: { register: 1200, renew: 1400, transfer: 1100 },
  net: { register: 1300, renew: 1500, transfer: 1200 },
  org: { register: 1300, renew: 1500, transfer: 1200 },
  biz: { register: 1200, renew: 1400, transfer: 1100 },
  info: { register: 1000, renew: 1100, transfer: 900 },
  xyz: { register: 800, renew: 900, transfer: 700 },
  co: { register: 2000, renew: 2200, transfer: 1900 },
  io: { register: 3500, renew: 3800, transfer: 3300 },
  app: { register: 1400, renew: 1600, transfer: 1300 },
  dev: { register: 1400, renew: 1600, transfer: 1300 },
  online: { register: 900, renew: 1000, transfer: 800 },
  store: { register: 1500, renew: 1700, transfer: 1400 },
  tech: { register: 1200, renew: 1400, transfer: 1100 },
};

function wholesaleUsdCents(tld: string, kind: "register" | "renew" | "transfer") {
  const row = GTLD_USD_CENTS[tld];
  if (row) return row[kind];
  return kind === "register" ? 1200 : kind === "renew" ? 1400 : 1100;
}

function isConfigured(creds: ProviderCredentials) {
  return Boolean(creds.apiKey && (creds.apiSecret || process.env.NAMECHEAP_API_USER));
}

function apiBase(creds: ProviderCredentials) {
  if (creds.apiUrl) return creds.apiUrl.replace(/\/$/, "");
  const sandbox = process.env.NAMECHEAP_SANDBOX !== "false";
  return sandbox
    ? "https://api.sandbox.namecheap.com/xml.response"
    : "https://api.namecheap.com/xml.response";
}

function authParams(creds: ProviderCredentials) {
  const apiUser =
    process.env.NAMECHEAP_API_USER ||
    creds.apiSecret || // apiSecret stores ApiUser when set from admin
    "";
  const userName = process.env.NAMECHEAP_USERNAME || apiUser;
  const clientIp = process.env.NAMECHEAP_CLIENT_IP || "127.0.0.1";
  return {
    ApiUser: apiUser,
    ApiKey: creds.apiKey || process.env.NAMECHEAP_API_KEY || "",
    UserName: userName,
    ClientIp: clientIp,
  };
}

async function namecheapGet(
  creds: ProviderCredentials,
  command: string,
  extra: Record<string, string>
) {
  const base = apiBase(creds);
  const params = new URLSearchParams({
    ...authParams(creds),
    Command: command,
    ...extra,
  });
  const url = `${base}?${params.toString()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const xml = await res.text();
  if (!res.ok) {
    throw new Error(`Namecheap HTTP ${res.status}`);
  }
  if (/Status="ERROR"/i.test(xml) || /<Errors>/i.test(xml)) {
    const errMatch = xml.match(/Number="(\d+)"[^>]*>([^<]+)/);
    throw new Error(errMatch ? `Namecheap ${errMatch[1]}: ${errMatch[2]}` : "Namecheap API error");
  }
  return xml;
}

function parseCheckResults(xml: string): Map<string, { available: boolean; premium: boolean }> {
  const map = new Map<string, { available: boolean; premium: boolean }>();
  const re =
    /DomainCheckResult[^>]*Domain="([^"]+)"[^>]*Available="([^"]+)"[^>]*(?:IsPremiumName="([^"]+)")?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    map.set(m[1].toLowerCase(), {
      available: m[2].toLowerCase() === "true",
      premium: (m[3] || "").toLowerCase() === "true",
    });
  }
  // Attribute order may vary — second pass
  if (map.size === 0) {
    const alt =
      /DomainCheckResult[^>]*Available="([^"]+)"[^>]*Domain="([^"]+)"[^>]*(?:IsPremiumName="([^"]+)")?/gi;
    while ((m = alt.exec(xml))) {
      map.set(m[2].toLowerCase(), {
        available: m[1].toLowerCase() === "true",
        premium: (m[3] || "").toLowerCase() === "true",
      });
    }
  }
  return map;
}

function buildResult(
  sld: string,
  tld: string,
  available: boolean,
  premium = false
): ProviderDomainResult {
  // Namecheap wholesale is USD — Pricing Engine locks FX + applies margin in LKR
  return {
    domain: `${sld}.${tld}`,
    sld,
    tld,
    available,
    premium,
    providerPriceCents: wholesaleUsdCents(tld, "register"),
    renewProviderCents: wholesaleUsdCents(tld, "renew"),
    transferProviderCents: wholesaleUsdCents(tld, "transfer"),
    currency: "USD",
  };
}

export class NamecheapAdapter implements ResellerProviderAdapter {
  readonly code: string;
  private fallback: MockResellerProvider;

  constructor(private readonly creds: ProviderCredentials) {
    this.code = creds.code;
    this.fallback = new MockResellerProvider(creds);
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

    const preferred = GTLD_LIST.includes(tld) ? tld : "com";
    const tlds = [preferred, ...GTLD_LIST.filter((t) => t !== preferred)].slice(0, 12);
    const domainList = tlds.map((t) => `${sld}.${t}`).join(",");

    if (!isConfigured(this.creds)) {
      const mock = await this.fallback.searchDomains(query);
      return {
        ...mock,
        results: (mock.results || []).filter((r) => !r.tld.includes("lk")),
        suggestions: (mock.suggestions || []).filter((r) => !r.tld.includes("lk")),
      };
    }

    try {
      const xml = await namecheapGet(this.creds, "namecheap.domains.check", {
        DomainList: domainList,
      });
      const checked = parseCheckResults(xml);
      const results = tlds.map((t) => {
        const domain = `${sld}.${t}`;
        const hit = checked.get(domain);
        return buildResult(sld, t, hit?.available ?? false, hit?.premium);
      });

      const primaryUnavailable = results[0] && !results[0].available;
      const suggestions = SUGGESTION_SUFFIXES.filter((sfx) => sfx !== sld)
        .slice(0, primaryUnavailable ? 6 : 4)
        .map((sfx) => buildResult(`${sld}${sfx}`, preferred, true));

      return { fqdn, sld, results, suggestions };
    } catch (error) {
      console.error("[namecheap:search]", error);
      const mock = await this.fallback.searchDomains(query);
      return {
        ...mock,
        results: (mock.results || []).filter((r) => !r.tld.includes("lk")),
        error: undefined,
      };
    }
  }

  async listPackages(): Promise<ProviderPackage[]> {
    // Domains-only provider — hosting catalog comes from hosting mocks / future adapters
    return [];
  }

  async provisionDomain(input: ProvisionDomainInput): Promise<ProvisionResult> {
    if (!isConfigured(this.creds)) {
      return {
        success: true,
        status: "PENDING",
        providerRef: `nc-manual-${Date.now()}`,
        message: `Queued for Namecheap registration: ${input.domain} (API credentials not configured)`,
      };
    }

    if (input.action !== "register") {
      return {
        success: true,
        status: "PENDING",
        providerRef: `nc-${input.action}-${Date.now()}`,
        message: `Queued Namecheap ${input.action} for ${input.domain} — complete in Namecheap panel or extend API`,
      };
    }

    try {
      const years = String(input.years || 1);
      const contact = {
        FirstName: "MernCrest",
        LastName: "Admin",
        Address1: "Colombo",
        City: "Colombo",
        StateProvince: "Western",
        PostalCode: "00100",
        Country: "LK",
        Phone: "+94.112000000",
        EmailAddress: input.customerEmail,
      };
      const roles = ["Registrant", "Tech", "Admin", "AuxBilling"] as const;
      const extra: Record<string, string> = {
        DomainName: input.domain,
        Years: years,
      };
      for (const role of roles) {
        for (const [k, v] of Object.entries(contact)) {
          extra[`${role}${k}`] = v;
        }
      }

      const xml = await namecheapGet(this.creds, "namecheap.domains.create", extra);
      const registered = /Registered="true"/i.test(xml);
      const orderId = xml.match(/OrderID="(\d+)"/i)?.[1];
      const domainId = xml.match(/DomainID="(\d+)"/i)?.[1];

      if (!registered) {
        return {
          success: false,
          status: "PENDING",
          providerRef: `nc-fail-${Date.now()}`,
          message: `Namecheap did not register ${input.domain} — queued for manual assist`,
        };
      }

      return {
        success: true,
        status: "ACTIVE",
        providerRef: domainId || orderId || `nc-${Date.now()}`,
        nameservers: ["dns1.registrar-servers.com", "dns2.registrar-servers.com"],
        message: `Registered ${input.domain} via Namecheap`,
      };
    } catch (error) {
      console.error("[namecheap:register]", error);
      return {
        success: false,
        status: "PENDING",
        providerRef: `nc-err-${Date.now()}`,
        message:
          error instanceof Error
            ? error.message
            : `Namecheap registration failed for ${input.domain}`,
      };
    }
  }

  async provisionHosting(input: ProvisionHostingInput): Promise<ProvisionResult> {
    return {
      success: true,
      status: "PENDING",
      providerRef: `nc-host-manual-${Date.now()}`,
      message: `Hosting ${input.label} queued — Namecheap adapter is domains-focused; provision via hosting provider`,
    };
  }
}
