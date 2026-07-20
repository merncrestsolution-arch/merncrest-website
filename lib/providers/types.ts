/** Reseller provider contracts — MernCrest resells via third-party APIs. */

export type ProviderService =
  | "domains"
  | "hosting"
  | "vps"
  | "ssl"
  | "email"
  | "cloud";

export type MarginCategory =
  | "domains"
  | "hosting"
  | "vps"
  | "ssl"
  | "email"
  | "cloud";

export type DomainAction = "register" | "renew" | "transfer";

export type ProviderDomainResult = {
  domain: string;
  sld: string;
  tld: string;
  available: boolean;
  premium?: boolean;
  /** Provider wholesale cost in cents */
  providerPriceCents: number;
  renewProviderCents: number;
  transferProviderCents: number;
  currency: string;
};

export type ProviderPackage = {
  providerProductId: string;
  name: string;
  description: string;
  category: MarginCategory;
  providerPriceCents: number;
  currency: string;
  billingPeriod: "ONCE" | "MONTHLY" | "YEARLY";
  specs?: Record<string, string | number>;
};

export type ProvisionDomainInput = {
  domain: string;
  sld: string;
  tld: string;
  action: DomainAction;
  years?: number;
  customerEmail: string;
};

export type ProvisionHostingInput = {
  planCode: string;
  providerProductId?: string;
  primaryDomain?: string;
  customerEmail: string;
  label: string;
};

export type ProvisionResult = {
  success: boolean;
  providerRef: string;
  /** ACTIVE when provider confirmed; PENDING when manual-assisted queue */
  status?: "ACTIVE" | "PENDING" | "PROVISIONING";
  panelUrl?: string;
  nameservers?: string[];
  message?: string;
  specs?: {
    diskMb?: number;
    bandwidthGb?: number;
    ramMb?: number;
  };
};

export type ProviderCredentials = {
  id: string;
  code: string;
  name: string;
  apiUrl: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  supportedServices: ProviderService[];
  status: string;
  defaultMarginCents: number;
};

export interface ResellerProviderAdapter {
  readonly code: string;
  searchDomains(query: string): Promise<{
    fqdn: string;
    sld: string;
    results: ProviderDomainResult[];
    suggestions: ProviderDomainResult[];
    error?: string;
  }>;
  listPackages(): Promise<ProviderPackage[]>;
  provisionDomain(input: ProvisionDomainInput): Promise<ProvisionResult>;
  provisionHosting(input: ProvisionHostingInput): Promise<ProvisionResult>;
}
