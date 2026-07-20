import { prisma } from "@/lib/db";
import { MockResellerProvider } from "@/lib/providers/mock-adapter";
import { NamecheapAdapter } from "@/lib/providers/namecheap-adapter";
import { DomainLkAdapter, isLkTld } from "@/lib/providers/domainlk-adapter";
import type {
  ProviderCredentials,
  ProviderService,
  ResellerProviderAdapter,
} from "@/lib/providers/types";

function parseServices(json: string): ProviderService[] {
  try {
    const parsed = JSON.parse(json) as string[];
    return parsed as ProviderService[];
  } catch {
    return [];
  }
}

export function toCredentials(row: {
  id: string;
  code: string;
  name: string;
  apiUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  supportedServices: string;
  status: string;
  defaultMarginCents: number;
}): ProviderCredentials {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    apiUrl: row.apiUrl,
    apiKey: row.apiKey,
    apiSecret: row.apiSecret,
    supportedServices: parseServices(row.supportedServices),
    status: row.status,
    defaultMarginCents: row.defaultMarginCents,
  };
}

/**
 * Resolve a reseller adapter by provider code.
 * namecheap → international gTLDs · domainlk → .lk · else mock.
 */
export function createAdapter(creds: ProviderCredentials): ResellerProviderAdapter {
  const code = creds.code.toLowerCase();
  if (code === "namecheap" || code.startsWith("namecheap")) {
    return new NamecheapAdapter(creds);
  }
  if (code === "domainlk" || code.includes("domainlk") || code.includes("domain-lk")) {
    return new DomainLkAdapter(creds);
  }
  return new MockResellerProvider(creds);
}

export async function getActiveProviders() {
  return prisma.provider.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
}

function hasDomainService(supportedServices: string) {
  return parseServices(supportedServices).includes("domains");
}

export async function getPrimaryDomainProvider() {
  const providers = await getActiveProviders();
  const withDomains = providers.find((p) => hasDomainService(p.supportedServices));
  return withDomains ?? providers[0] ?? null;
}

/** Prefer DomainLK for .lk TLDs, Namecheap for gTLDs, else priority order. */
export async function getDomainProviderForTld(tld: string) {
  const providers = await getActiveProviders();
  const domainProviders = providers.filter((p) => hasDomainService(p.supportedServices));

  if (isLkTld(tld)) {
    const lk =
      domainProviders.find((p) => p.code.toLowerCase().includes("domainlk")) ||
      domainProviders.find((p) => p.code.toLowerCase().includes("lk"));
    if (lk) return lk;
  } else {
    const nc = domainProviders.find((p) => p.code.toLowerCase().includes("namecheap"));
    if (nc) return nc;
  }

  return domainProviders[0] ?? providers[0] ?? null;
}

export async function getAdapterForProviderId(providerId: string) {
  const row = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!row || row.status !== "ACTIVE") return null;
  return { provider: row, adapter: createAdapter(toCredentials(row)) };
}

function ephemeralMock(): ProviderCredentials {
  return {
    id: "ephemeral",
    code: "mock-a",
    name: "Default Mock Provider",
    apiUrl: null,
    apiKey: null,
    apiSecret: null,
    supportedServices: ["domains", "hosting", "vps", "ssl", "email", "cloud"],
    status: "ACTIVE",
    defaultMarginCents: 0,
  };
}

export async function getDomainSearchAdapter(tldHint?: string) {
  const provider = tldHint
    ? await getDomainProviderForTld(tldHint)
    : await getPrimaryDomainProvider();

  if (!provider) {
    return { provider: null, adapter: createAdapter(ephemeralMock()) };
  }
  return { provider, adapter: createAdapter(toCredentials(provider)) };
}

/** Resolve adapter + provider row for a given TLD (used by fulfillment). */
export async function getDomainAdapterForTld(tld: string) {
  const provider = await getDomainProviderForTld(tld);
  if (!provider) {
    return { provider: null, adapter: createAdapter(ephemeralMock()) };
  }
  return { provider, adapter: createAdapter(toCredentials(provider)) };
}
