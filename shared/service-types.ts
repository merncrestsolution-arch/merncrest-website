import { z } from "zod";
import type { ServiceType } from "@prisma/client";

export type ServiceTypeConfig = {
  label: string;
  iconKey: string;
  metadataSchema: z.ZodType<Record<string, unknown>>;
};

const domainMetadataSchema = z.object({
  tld: z.string().min(1).max(32).optional(),
  autoRenew: z.boolean().optional(),
  renewalCostCents: z.number().int().min(0).optional(),
});

const hostingMetadataSchema = z.object({
  panelUrl: z.string().url().optional(),
  primaryDomain: z.string().max(255).optional(),
  renewalCostCents: z.number().int().min(0).optional(),
});

const securityMetadataSchema = z.object({
  planName: z.string().max(120).optional(),
  coverageLevel: z.string().max(80).optional(),
});

const sslMetadataSchema = z.object({
  certificateType: z.enum(["DV", "OV", "EV", "WILDCARD"]).optional(),
  commonName: z.string().max(255).optional(),
});

const cloudMetadataSchema = z.object({
  provider: z.string().max(80).optional(),
  instanceType: z.string().max(80).optional(),
  region: z.string().max(80).optional(),
});

const emailHostingMetadataSchema = z.object({
  mailboxCount: z.number().int().min(1).optional(),
  storageGb: z.number().min(0).optional(),
});

const maintenanceMetadataSchema = z.object({
  scope: z.string().max(500).optional(),
  hoursPerMonth: z.number().min(0).optional(),
});

const backupMetadataSchema = z.object({
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
