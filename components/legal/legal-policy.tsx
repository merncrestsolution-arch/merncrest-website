import { Link } from "@/i18n/routing";
import { PageHero } from "@/components/ui/page-hero";

const policies: Record<
  string,
  { title: string; sections: { heading: string; body: string }[] }
> = {
  refund: {
    title: "Refund Policy",
    sections: [
      { heading: "Overview", body: "MernCrest Solutions Pvt Ltd aims for fair billing. Refund eligibility depends on product type and delivery stage." },
      { heading: "Domains", body: "Domain registrations are generally non-refundable once registered with the registry." },
      { heading: "Hosting", body: "Unused prepaid hosting may be eligible for prorated credit within the first 14 days unless otherwise stated in your order." },
      { heading: "Custom software", body: "Milestone-based projects follow the signed service agreement; completed milestones are non-refundable." },
    ],
  },
  "hosting-policy": {
    title: "Hosting Policy",
    sections: [
      { heading: "Acceptable use", body: "Hosting accounts must not be used for illegal content, spam, or activities that degrade shared infrastructure." },
      { heading: "Resource limits", body: "Plans include fair-use CPU, RAM, disk, and bandwidth. Sustained abuse may require an upgrade." },
      { heading: "Backups", body: "Managed plans include scheduled backups; customers should retain their own copies of critical data." },
    ],
  },
  "domain-policy": {
    title: "Domain Policy",
    sections: [
      { heading: "Registration", body: "Domains are registered in the customer's name subject to registry rules (.lk, ICANN gTLDs, etc.)." },
      { heading: "Renewals", body: "Renewal reminders are sent before expiry. Failure to renew may result in loss of the domain." },
      { heading: "Transfers", body: "Transfers require valid authorization codes and unlocked status where applicable." },
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    sections: [
      { heading: "What we use", body: "We use essential cookies for authentication, locale, and theme preferences, plus analytics where consented." },
      { heading: "Control", body: "You can control non-essential cookies via browser settings and future consent banners." },
    ],
  },
  aup: {
    title: "Acceptable Use Policy",
    sections: [
      { heading: "Prohibited", body: "Illegal activity, malware distribution, unauthorized access attempts, and harassment are prohibited." },
      { heading: "Enforcement", body: "Violations may result in suspension, termination, and reporting to authorities where required." },
    ],
  },
  sla: {
    title: "Service Level Agreement (SLA)",
    sections: [
      { heading: "Availability", body: "Enterprise plans may include uptime targets defined in the order form or MSA." },
      { heading: "Support response", body: "Ticket priority determines initial response windows for Billing, Technical, and Critical incidents." },
      { heading: "Credits", body: "Service credits, if any, are applied per the signed SLA schedule." },
    ],
  },
  "service-agreement": {
    title: "Service Agreement",
    sections: [
      { heading: "Scope", body: "Deliverables, timelines, and fees are defined per quotation or statement of work." },
      { heading: "IP", body: "Unless otherwise agreed, custom software IP transfers upon full payment of project fees." },
      { heading: "Liability", body: "Liability caps and warranties are as stated in the executed agreement." },
    ],
  },
};

export default function LegalPolicyPage({
  title,
  slug,
}: {
  title?: string;
  slug: keyof typeof policies;
}) {
  const policy = policies[slug];
  const pageTitle = title || policy.title;

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Legal"
        title={pageTitle}
        description="MernCrest Solutions (Pvt) Ltd · Last updated 2026"
        align="left"
      >
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
          ← Home
        </Link>
      </PageHero>
      <div className="stitch-page-body max-w-3xl">
        <div className="stitch-card stitch-stack-lg">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-xl font-semibold text-white mb-2">{s.heading}</h2>
              <p className="text-muted leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export { policies };
