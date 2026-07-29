import { resolve4, resolve6, resolveCname, resolveMx, resolveNs, resolveTxt } from "dns/promises";
import type { DnsRecord } from "@/shared/service-types";

export type LiveDnsSnapshot = {
  domainName: string;
  nameservers: string[];
  records: DnsRecord[];
  fetchedAt: string;
  source: "live_dns";
  rdap?: {
    registrar?: string | null;
    registrationDate?: string | null;
    expiryDate?: string | null;
    status?: string | null;
    whoisStatus?: string | null;
  };
  sslCertificateStatus?: "ACTIVE" | "NONE" | "UNKNOWN";
};

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function fetchRdap(domainName: string) {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domainName)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      events?: Array<{ eventAction?: string; eventDate?: string }>;
      nameservers?: Array<{ ldhName?: string }>;
      status?: string[];
      entities?: Array<{
        roles?: string[];
        vcardArray?: [string, Array<[string, unknown, string] | [string, Record<string, string>]>];
      }>;
    };

    const registrarEntity = data.entities?.find((e) => e.roles?.includes("registrar"));
    let registrar: string | null = null;
    if (registrarEntity?.vcardArray?.[1]) {
      const fn = registrarEntity.vcardArray[1].find((row) => row[0] === "fn");
      if (fn && typeof fn[3] === "string") registrar = fn[3];
    }

    const registration = data.events?.find((e) => e.eventAction === "registration");
    const expiration = data.events?.find((e) => e.eventAction === "expiration");

    return {
      registrar,
      registrationDate: registration?.eventDate ?? null,
      expiryDate: expiration?.eventDate ?? null,
      status: data.status?.join(", ") ?? null,
      whoisStatus: data.status?.[0] ?? null,
      nameservers: (data.nameservers ?? [])
        .map((ns) => ns.ldhName?.toLowerCase())
        .filter(Boolean) as string[],
    };
  } catch {
    return null;
  }
}

async function checkSslStatus(domainName: string): Promise<"ACTIVE" | "NONE" | "UNKNOWN"> {
  try {
    const res = await fetch(`https://${domainName}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    return res.ok || res.status < 500 ? "ACTIVE" : "NONE";
  } catch {
    return "UNKNOWN";
  }
}

/** Query live public DNS + RDAP for a domain. */
export async function lookupLiveDns(domainName: string): Promise<LiveDnsSnapshot> {
  const normalized = domainName.trim().toLowerCase().replace(/\.$/, "");
  const records: DnsRecord[] = [];
  const nameserverSet = new Set<string>();

  const ns = await safeResolve(() => resolveNs(normalized));
  if (ns) {
    for (const host of ns) {
      const lower = host.toLowerCase().replace(/\.$/, "");
      nameserverSet.add(lower);
      records.push({ type: "NS", name: "@", value: lower, ttl: 3600 });
    }
  }

  const rdap = await fetchRdap(normalized);
  if (rdap?.nameservers?.length) {
    for (const nsHost of rdap.nameservers) {
      nameserverSet.add(nsHost);
      if (!records.some((r) => r.type === "NS" && r.value === nsHost)) {
        records.push({ type: "NS", name: "@", value: nsHost, ttl: 3600 });
      }
    }
  }

  const a = await safeResolve(() => resolve4(normalized));
  if (a) {
    for (const ip of a) {
      records.push({ type: "A", name: "@", value: ip, ttl: 3600 });
    }
  }

  const aaaa = await safeResolve(() => resolve6(normalized));
  if (aaaa) {
    for (const ip of aaaa) {
      records.push({ type: "AAAA", name: "@", value: ip, ttl: 3600 });
    }
  }

  const mx = await safeResolve(() => resolveMx(normalized));
  if (mx) {
    for (const entry of mx) {
      records.push({
        type: "MX",
        name: "@",
        value: entry.exchange.replace(/\.$/, ""),
        ttl: 3600,
        priority: entry.priority,
      });
    }
  }

  const txt = await safeResolve(() => resolveTxt(normalized));
  if (txt) {
    for (const chunks of txt) {
      records.push({
        type: "TXT",
        name: "@",
        value: chunks.join(""),
        ttl: 3600,
      });
    }
  }

  for (const sub of ["www", "mail"]) {
    const host = `${sub}.${normalized}`;
    const cname = await safeResolve(() => resolveCname(host));
    if (cname?.length) {
      records.push({
        type: "CNAME",
        name: sub,
        value: cname[0].replace(/\.$/, ""),
        ttl: 3600,
      });
    } else {
      const subA = await safeResolve(() => resolve4(host));
      if (subA) {
        for (const ip of subA) {
          records.push({ type: "A", name: sub, value: ip, ttl: 3600 });
        }
      }
    }
  }

  const sslCertificateStatus = await checkSslStatus(normalized);

  return {
    domainName: normalized,
    nameservers: Array.from(nameserverSet).sort(),
    records,
    fetchedAt: new Date().toISOString(),
    source: "live_dns",
    rdap: rdap
      ? {
          registrar: rdap.registrar,
          registrationDate: rdap.registrationDate,
          expiryDate: rdap.expiryDate,
          status: rdap.status,
          whoisStatus: rdap.whoisStatus,
        }
      : undefined,
    sslCertificateStatus,
  };
}
