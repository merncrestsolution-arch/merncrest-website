import { z } from "zod";
import type { ServiceType } from "@prisma/client";

export type ServiceTypeConfig = {
  label: string;
  iconKey: string;
  metadataSchema: z.ZodType<Record<string, unknown>>;
};

const costFields = z.object({
  serviceCostCents: z.number().int().min(0).optional(),
  renewalCostCents: z.number().int().min(0).optional(),
});

const domainMetadataSchema = costFields.extend({
  tld: z.string().min(1).max(32).optional(),
  autoRenew: z.boolean().optional(),
});

const hostingMetadataSchema = costFields.extend({
  panelUrl: z.string().url().optional(),
  primaryDomain: z.string().max(255).optional(),
});

const securityMetadataSchema = costFields.extend({
  planName: z.string().max(120).optional(),
  coverageLevel: z.string().max(80).optional(),
});

const sslMetadataSchema = costFields.extend({
  certificateType: z.enum(["DV", "OV", "EV", "WILDCARD"]).optional(),
  commonName: z.string().max(255).optional(),
});

const cloudMetadataSchema = costFields.extend({
  provider: z.string().max(80).optional(),
  instanceType: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
});

const emailHostingMetadataSchema = costFields.extend({
  mailboxCount: z.number().int().min(1).optional(),
  storageGb: z.number().min(0).optional(),
});

const maintenanceMetadataSchema = costFields.extend({
  scope: z.string().max(500).optional(),
  hoursPerMonth: z.number().min(0).optional(),
});

const backupMetadataSchema = costFields.extend({
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  retentionDays: z.number().int().min(1).optional(),
});

const otherMetadataSchema = z.record(z.string(), z.unknown());

export const SERVICE_TYPE_CONFIG: Record<ServiceType, ServiceTypeConfig> = {
  DOMAIN_REGISTRATION: {
    label: "Domain Registration",
    iconKey: "globe",
    metadataSchema: domainMetadataSchema,
  },
  HOSTING: {
    label: "Web Hosting",
    iconKey: "server",
    metadataSchema: hostingMetadataSchema,
  },
  SECURITY: {
    label: "Security",
    iconKey: "shield",
    metadataSchema: securityMetadataSchema,
  },
  SSL_CERTIFICATE: {
    label: "SSL Certificate",
    iconKey: "lock",
    metadataSchema: sslMetadataSchema,
  },
  CLOUD_SERVICE: {
    label: "Cloud Service",
    iconKey: "cloud",
    metadataSchema: cloudMetadataSchema,
  },
  EMAIL_HOSTING: {
    label: "Email Hosting",
    iconKey: "mail",
    metadataSchema: emailHostingMetadataSchema,
  },
  MAINTENANCE: {
    label: "Maintenance",
    iconKey: "wrench",
    metadataSchema: maintenanceMetadataSchema,
  },
  BACKUP: {
    label: "Backup",
    iconKey: "database",
    metadataSchema: backupMetadataSchema,
  },
  OTHER: {
    label: "Other",
    iconKey: "box",
    metadataSchema: otherMetadataSchema,
  },
};

export function getServiceTypeLabel(serviceType: ServiceType): string {
  return SERVICE_TYPE_CONFIG[serviceType].label;
}

export function getServiceTypeIconKey(serviceType: ServiceType): string {
  return SERVICE_TYPE_CONFIG[serviceType].iconKey;
}

export function validateServiceMetadata(
  serviceType: ServiceType,
  metadata: unknown
): Record<string, unknown> | null {
  if (metadata === null || metadata === undefined) return null;
  return SERVICE_TYPE_CONFIG[serviceType].metadataSchema.parse(metadata);
}

export const DNS_RECORD_SCHEMA = z.object({
  type: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"]),
  name: z.string().max(255),
  value: z.string().max(2000),
  ttl: z.number().int().min(60).max(86400).default(3600),
  priority: z.number().int().min(0).max(65535).optional(),
});

export const DNS_RECORDS_SCHEMA = z.array(DNS_RECORD_SCHEMA);

export type DnsRecord = z.infer<typeof DNS_RECORD_SCHEMA>;
