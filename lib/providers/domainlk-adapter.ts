/**
 * DomainLK / .lk ccTLD reseller adapter.
 *
 * Sri Lankan .lk resellers (RegisterHere.lk, Green Line, etc.) issue private API
 * credentials after partnership approval. This adapter speaks a simple REST contract:
 *
 *   GET  {apiUrl}/check?domain=example.lk     → { available: boolean, price?: number }
 *   POST {apiUrl}/register                     → { success, providerRef, nameservers? }
 *        body: { domain, years, customerEmail, action }
 *
 * Configure Provider.apiUrl + apiKey (Bearer). Without credentials, uses wholesale
 * .lk pricing with mock availability so marketplace search still works locally.
 * Live register without API → PENDING manual-assisted queue (Phase 1 OK).
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
  PROVIDER_TLD_COST,
  normalizeDomainInput,
} from "@/lib/providers/mock-adapter";

const LK_TLDS = [
  "lk",
  "com.lk",
  "org.lk",
  "edu.lk",
  "sch.lk",
  "ngo.lk",
  "hotel.lk",
  "soc.lk",
];

const RESERVED = new Set([
  "google",
  "facebook",
  "microsoft",
  "apple",
  "amazon",
  "merncrest",
  "gov",
  "localhost",
  "example",
]);

function wholesale(tld: string, kind: "register" | "renew" | "transfer") {
  const row = PROVIDER_TLD_COST[tld] ?? PROVIDER_TLD_COST.lk;
  return row[kind];
}

function isConfigured(creds: ProviderCredentials) {
  return Boolean(creds.apiUrl && creds.apiKey);
}

function buildResult(sld: string, tld: string, available: boolean): ProviderDomainResult {
  return {
    domain: `${sld}.${tld}`,
    sld,
    tld,
    available,
    premium: false,
    providerPriceCents: wholesale(tld, "register"),
    renewProviderCents: wholesale(tld, "renew"),
    transferProviderCents: wholesale(tld, "transfer"),
    currency: "LKR",
  };
}

function mockAvailable(sld: string) {
  return (
    !RESERVED.has(sld) &&
    !/[^a-z0-9-]/i.test(sld) &&
    !sld.startsWith("-") &&
    !sld.endsWith("-")
  );
}

export class DomainLkAdapter implements ResellerProviderAdapter {
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

    const preferred = LK_TLDS.includes(tld) ? tld : "lk";
    const tlds = [preferred, ...LK_TLDS.filter((t) => t !== preferred)];

    if (!isConfigured(this.creds)) {
      const results = tlds.map((t) => buildResult(sld, t, mockAvailable(sld)));
      const suggestions = ["online", "lk", "app", "tech"]
        .filter((sfx) => sfx !== sld)
        .slice(0, 4)
        .map((sfx) => buildResult(`${sld}${sfx}`, "lk", true));
      return { fqdn, sld, results, suggestions };
    }

    const base = this.creds.apiUrl!.replace(/\/$/, "");
    const results: ProviderDomainResult[] = [];

    for (const t of tlds) {
      const domain = `${sld}.${t}`;
      try {
        const res = await fetch(
          `${base}/check?domain=${encodeURIComponent(domain)}`,
          {
            headers: {
              Authorization: `Bearer ${this.creds.apiKey}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );
        if (!res.ok) {
          results.push(buildResult(sld, t, mockAvailable(sld)));
          continue;
        }
        const data = (await res.json()) as {
          available?: boolean;
          price?: number;
          priceCents?: number;
        };
        const row = buildResult(sld, t, Boolean(data.available));
        if (typeof data.priceCents === "number") {
          row.providerPriceCents = data.priceCents;
          row.renewProviderCents = data.priceCents;
        } else if (typeof data.price === "number") {
          // Assume LKR major units
          row.providerPriceCents = Math.round(data.price * 100);
          row.renewProviderCents = row.providerPriceCents;
        }
        results.push(row);
      } catch (error) {
        console.error("[domainlk:check]", domain, error);
        results.push(buildResult(sld, t, mockAvailable(sld)));
      }
    }

    const primaryUnavailable = results[0] && !results[0].available;
    const suggestions = ["online", "pro", "hq", "app"]
      .slice(0, primaryUnavailable ? 6 : 4)
      .map((sfx) => buildResult(`${sld}${sfx}`, "lk", true));

    return { fqdn, sld, results, suggestions };
  }

  async listPackages(): Promise<ProviderPackage[]> {
    return [];
  }

  async provisionDomain(input: ProvisionDomainInput): Promise<ProvisionResult> {
    if (!isConfigured(this.creds)) {
      return {
        success: true,
        status: "PENDING",
        providerRef: `lk-manual-${Date.now()}`,
        message: `Queued for DomainLK registration: ${input.domain} (API not configured — manual assist)`,
      };
    }

    try {
      const base = this.creds.apiUrl!.replace(/\/$/, "");
      const res = await fetch(`${base}/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.creds.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          domain: input.domain,
          years: input.years || 1,
          customerEmail: input.customerEmail,
          action: input.action,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          status: "PENDING",
          providerRef: `lk-fail-${Date.now()}`,
          message: `DomainLK HTTP ${res.status}: ${text.slice(0, 200)}`,
        };
      }

      const data = (await res.json()) as {
        success?: boolean;
        providerRef?: string;
        nameservers?: string[];
        message?: string;
      };

      if (!data.success) {
        return {
          success: false,
          status: "PENDING",
          providerRef: data.providerRef || `lk-pending-${Date.now()}`,
          message: data.message || `DomainLK did not confirm ${input.domain}`,
        };
      }

      return {
        success: true,
        status: "ACTIVE",
        providerRef: data.providerRef || `lk-${Date.now()}`,
        nameservers: data.nameservers,
        message: data.message || `Registered ${input.domain} via DomainLK`,
      };
    } catch (error) {
      console.error("[domainlk:register]", error);
      return {
        success: false,
        status: "PENDING",
        providerRef: `lk-err-${Date.now()}`,
        message:
          error instanceof Error
            ? error.message
            : `DomainLK registration failed for ${input.domain}`,
      };
    }
  }

  async provisionHosting(input: ProvisionHostingInput): Promise<ProvisionResult> {
    return {
      success: true,
      status: "PENDING",
      providerRef: `lk-host-manual-${Date.now()}`,
      message: `Hosting ${input.label} is not provisioned via DomainLK — use hosting provider`,
    };
  }
}

export function isLkTld(tld: string) {
  const t = tld.toLowerCase();
  return t === "lk" || t.endsWith(".lk");
}
