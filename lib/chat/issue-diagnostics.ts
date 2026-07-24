export type DiagnosticIssue = {
  id: string;
  label: string;
  category: "domain" | "hosting" | "ssl" | "dns" | "billing" | "email" | "general";
  likelihood: "high" | "medium" | "low";
  reply: string;
};

const ISSUE_PATTERNS: {
  keywords: RegExp;
  issues: Omit<DiagnosticIssue, "likelihood">[];
}[] = [
  {
    keywords: /domain.*(not work|down|expir|broken|issue)|website.*not.*(work|load|open)|site.*down/i,
    issues: [
      {
        id: "domain_expired",
        label: "Domain Expired",
        category: "domain",
        reply:
          "I've checked your account — it looks like your domain may have expired or is pending renewal. I'll verify the registration status and guide you through renewal if needed.",
      },
      {
        id: "dns_error",
        label: "DNS Error",
        category: "dns",
        reply:
          "This could be a DNS configuration issue. I'll review your domain's nameserver and DNS records to identify any misconfiguration.",
      },
      {
        id: "dns_propagation",
        label: "DNS Propagation",
        category: "dns",
        reply:
          "DNS changes can take up to 24–48 hours to propagate globally. I'll check when your last DNS update was made and confirm the current status.",
      },
    ],
  },
  {
    keywords: /hosting.*(suspend|down|not work)|server.*down|website.*offline|can't access.*site/i,
    issues: [
      {
        id: "hosting_suspended",
        label: "Hosting Suspended",
        category: "hosting",
        reply:
          "Your hosting account may be suspended — this can happen due to an overdue invoice or resource limits. I'll check your account status and restore service if applicable.",
      },
      {
        id: "hosting_down",
        label: "Hosting Outage",
        category: "hosting",
        reply:
          "I'm checking our provider status for any ongoing outages affecting your hosting. I'll update you shortly with the findings.",
      },
    ],
  },
  {
    keywords: /ssl|certificate|https|not secure|padlock/i,
    issues: [
      {
        id: "ssl_expired",
        label: "SSL Expired",
        category: "ssl",
        reply:
          "Your SSL certificate may have expired or failed to renew. I'll verify the certificate status and initiate renewal if needed.",
      },
      {
        id: "ssl_mismatch",
        label: "SSL Mismatch",
        category: "ssl",
        reply:
          "This could be an SSL certificate mismatch — the certificate may not cover your domain name. I'll review the certificate configuration.",
      },
    ],
  },
  {
    keywords: /email.*(not work|bounce|can't send|can't receive)|mail.*issue/i,
    issues: [
      {
        id: "email_quota",
        label: "Email Quota Full",
        category: "email",
        reply:
          "Your business email mailbox may have reached its storage limit. I'll check your account quota and help resolve this.",
      },
      {
        id: "email_dns",
        label: "Email DNS (MX/SPF)",
        category: "dns",
        reply:
          "Email delivery issues are often caused by missing or incorrect MX/SPF records. I'll verify your DNS email records.",
      },
    ],
  },
  {
    keywords: /invoice|payment|bill|overdue|renew/i,
    issues: [
      {
        id: "invoice_pending",
        label: "Pending Invoice",
        category: "billing",
        reply:
          "I can see there may be a pending invoice on your account. I'll share the payment details and help you complete the payment.",
      },
      {
        id: "renewal_due",
        label: "Renewal Due",
        category: "billing",
        reply:
          "Your service renewal date is approaching. I'll confirm the renewal amount and process it for you if you'd like.",
      },
    ],
  },
];

export function diagnoseFromMessage(
  message: string,
  serviceHints?: { expiredDomains?: boolean; suspendedHosting?: boolean; sslExpired?: boolean }
): DiagnosticIssue[] {
  const results: DiagnosticIssue[] = [];

  for (const pattern of ISSUE_PATTERNS) {
    if (pattern.keywords.test(message)) {
      for (const issue of pattern.issues) {
        results.push({ ...issue, likelihood: "high" });
      }
    }
  }

  if (serviceHints?.expiredDomains) {
    const existing = results.find((r) => r.id === "domain_expired");
    if (!existing) {
      results.push({
        id: "domain_expired",
        label: "Domain Expired",
        category: "domain",
        likelihood: "high",
        reply:
          "I've checked your account — your domain registration appears to have expired. I'll guide you through renewal.",
      });
    }
  }

  if (serviceHints?.suspendedHosting) {
    const existing = results.find((r) => r.id === "hosting_suspended");
    if (!existing) {
      results.push({
        id: "hosting_suspended",
        label: "Hosting Suspended",
        category: "hosting",
        likelihood: "high",
        reply:
          "Your hosting account is currently suspended. I'll check the reason and help restore your service.",
      });
    }
  }

  if (serviceHints?.sslExpired) {
    const existing = results.find((r) => r.id === "ssl_expired");
    if (!existing) {
      results.push({
        id: "ssl_expired",
        label: "SSL Expired",
        category: "ssl",
        likelihood: "high",
        reply:
          "Your SSL certificate has expired. I'll initiate renewal to restore secure HTTPS access.",
      });
    }
  }

  if (!results.length && message.trim().length > 5) {
    results.push({
      id: "general_support",
      label: "General Support",
      category: "general",
      likelihood: "low",
      reply:
        "Thank you for reaching out. I'm reviewing your account and services now to identify the issue. Could you share any error messages you're seeing?",
    });
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).slice(0, 6);
}

export function detectServiceCategories(message: string): string[] {
  const cats: string[] = [];
  if (/domain|dns|\.lk|\.com/i.test(message)) cats.push("Domain");
  if (/hosting|server|website|site/i.test(message)) cats.push("Hosting");
  if (/ssl|https|certificate/i.test(message)) cats.push("SSL");
  if (/email|mail/i.test(message)) cats.push("Email");
  if (/invoice|payment|bill/i.test(message)) cats.push("Billing");
  return cats;
}
