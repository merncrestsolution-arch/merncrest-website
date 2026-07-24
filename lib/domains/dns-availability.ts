import { promises as dns } from "dns";

/**
 * Heuristic: registered domains usually have NS or A records.
 * Returns true = taken, false = likely free, null = could not determine.
 */
export async function isDomainRegisteredDns(fqdn: string): Promise<boolean | null> {
  const domain = fqdn.toLowerCase().trim();
  if (!domain) return null;

  try {
    const ns = await dns.resolveNs(domain);
    if (ns.length > 0) return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      // fall through to A/AAAA check
    } else if (code !== "ENODATA") {
      // SERVFAIL etc. — try A record before giving up
    }
  }

  for (const resolver of [dns.resolve4, dns.resolve6] as const) {
    try {
      const records = await resolver(domain);
      if (records.length > 0) return true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOTFOUND" || code === "ENODATA") continue;
      return null;
    }
  }

  return false;
}

export async function isDomainAvailableDns(fqdn: string): Promise<boolean | null> {
  const registered = await isDomainRegisteredDns(fqdn);
  if (registered === true) return false;
  if (registered === false) return true;
  return null;
}

export async function probeManyDns(
  fqdns: string[]
): Promise<Map<string, boolean | null>> {
  const map = new Map<string, boolean | null>();
  await Promise.all(
    fqdns.map(async (fqdn) => {
      map.set(fqdn.toLowerCase(), await isDomainAvailableDns(fqdn));
    })
  );
  return map;
}
