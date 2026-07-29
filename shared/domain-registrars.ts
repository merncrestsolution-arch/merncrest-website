export const DOMAIN_REGISTRARS = [
  { value: "NAMECHEAP", label: "Namecheap" },
  { value: "REGISTRY_LK", label: "Registry.lk" },
  { value: "GODADDY", label: "GoDaddy" },
  { value: "CLOUDFLARE", label: "Cloudflare Registrar" },
  { value: "OTHER", label: "Other" },
] as const;

export type DomainRegistrar = (typeof DOMAIN_REGISTRARS)[number]["value"];

export const GIT_PROVIDERS = [
  { value: "GITHUB", label: "GitHub" },
  { value: "GITLAB", label: "GitLab" },
  { value: "BITBUCKET", label: "Bitbucket" },
  { value: "OTHER", label: "Other" },
] as const;

export type GitProvider = (typeof GIT_PROVIDERS)[number]["value"];

export const SSL_STATUSES = ["NONE", "ACTIVE", "EXPIRING", "EXPIRED", "UNKNOWN"] as const;
export type SslStatus = (typeof SSL_STATUSES)[number];

export function parseDomainParts(domainName: string): { name: string; extension: string } {
  const trimmed = domainName.trim().toLowerCase();
  const dot = trimmed.indexOf(".");
  if (dot <= 0) return { name: trimmed, extension: "" };
  return {
    name: trimmed.slice(0, dot),
    extension: trimmed.slice(dot + 1),
  };
}

export function detectGitProvider(url: string | null | undefined): GitProvider | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("github.com")) return "GITHUB";
  if (lower.includes("gitlab.com") || lower.includes("gitlab.")) return "GITLAB";
  if (lower.includes("bitbucket.org")) return "BITBUCKET";
  return "OTHER";
}

export function registrarLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = DOMAIN_REGISTRARS.find((r) => r.value === value);
  return found?.label ?? value;
}
