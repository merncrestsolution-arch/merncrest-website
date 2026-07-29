import { prisma } from "@/lib/db";
import { lookupLiveDns } from "@/lib/dns/live-dns-lookup";
import { writeDomainHistory } from "@/lib/services/service-domains";
import { parseDomainParts } from "@/shared/domain-registrars";
import type { DnsRecord } from "@/shared/service-types";

/** Pull live DNS/nameserver/RDAP data and persist on the service domain record. */
export async function syncLiveDnsForDomain(domainId: string, actorId: string) {
  const domain = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!domain) return null;

  const live = await lookupLiveDns(domain.domainName);
  const { extension } = parseDomainParts(domain.domainName);

  const data: Record<string, unknown> = {
    updatedBy: actorId,
    dnsZone: domain.dnsZone || domain.domainName,
    domainExtension: domain.domainExtension || extension || null,
  };

  if (live.nameservers.length > 0) data.nameservers = live.nameservers;
  if (live.records.length > 0) data.dnsRecords = live.records as DnsRecord[];
  if (live.rdap?.registrar) data.registrar = live.rdap.registrar;
  if (live.rdap?.registrationDate) {
    data.registrationDate = new Date(live.rdap.registrationDate);
  }
  if (live.rdap?.expiryDate) data.expiryDate = new Date(live.rdap.expiryDate);
  if (live.rdap?.whoisStatus) data.whoisStatus = live.rdap.whoisStatus;
  if (live.sslCertificateStatus && live.sslCertificateStatus !== "UNKNOWN") {
    data.sslCertificateStatus = live.sslCertificateStatus;
  }

  const regDate = (data.registrationDate as Date | undefined) ?? domain.registrationDate;
  const expDate = (data.expiryDate as Date | undefined) ?? domain.expiryDate;
  if (!domain.registrationPeriodMonths && regDate && expDate) {
    const months = Math.max(
      1,
      Math.round((expDate.getTime() - regDate.getTime()) / (30.44 * 86400000))
    );
    data.registrationPeriodMonths = months;
  }
  if (!domain.renewalDate && domain.autoRenew && expDate) {
    data.renewalDate = expDate;
  }

  const updated = await prisma.serviceDomain.update({
    where: { id: domainId },
    data,
  });

  await writeDomainHistory(domainId, "DNS_SYNCED_FROM_LIVE", actorId, {
    nameserverCount: live.nameservers.length,
    recordCount: live.records.length,
    fetchedAt: live.fetchedAt,
  });

  return { domain: updated, live };
}

/** Enrich stored domain when key lifecycle fields are missing (RDAP / SSL / period). */
export async function enrichServiceDomainFromLiveIfNeeded(domainId: string, actorId: string) {
  const domain = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!domain) return null;

  const records = Array.isArray(domain.dnsRecords) ? domain.dnsRecords : [];
  const needsEnrichment =
    domain.nameservers.length === 0 ||
    records.length === 0 ||
    !domain.whoisStatus ||
    !domain.registrationPeriodMonths ||
    (!domain.renewalDate && domain.autoRenew && domain.expiryDate);

  if (!needsEnrichment) {
    return { domain, live: null, skipped: true as const };
  }

  return syncLiveDnsForDomain(domainId, actorId);
}

/** Sync live DNS only when stored nameservers and records are both empty. */
export async function ensureLiveDnsSyncedIfEmpty(domainId: string, actorId?: string) {
  const domain = await prisma.serviceDomain.findFirst({
    where: { id: domainId, deletedAt: null },
  });
  if (!domain) return null;

  const records = Array.isArray(domain.dnsRecords) ? domain.dnsRecords : [];
  if (domain.nameservers.length > 0 || records.length > 0) {
    return { domain, live: null, skipped: true as const };
  }

  return syncLiveDnsForDomain(domainId, actorId ?? domain.updatedBy ?? domain.createdBy);
}
