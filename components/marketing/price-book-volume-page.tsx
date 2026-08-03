import type { LucideIcon } from "lucide-react";
import { Check, Clock, ShieldCheck, Wallet } from "lucide-react";
import { PageHero } from "@/components/ui/page-hero";
import { QuoteDialog } from "@/components/forms/quote-dialog";
import { cn } from "@/lib/utils";
import {
  formatPackagePrice,
  formatAddOnPrice,
  type PriceBookVolume,
} from "@/lib/data/price-book";

type PriceBookVolumePageProps = {
  volume: PriceBookVolume;
  quoteInterest: string;
  heroDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaIcon: LucideIcon;
};

function ServiceIncludes({ service }: { service: PriceBookVolume["services"][0] }) {
  if (service.tierIncludes?.length) {
    return (
      <div className="space-y-4">
        {service.tierIncludes.map((tier) => (
          <div key={tier.tier}>
            <p className="text-sm font-medium text-foreground mb-2">{tier.label}</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {tier.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  const bullets = service.includes ?? service.features ?? [];
  if (!bullets.length) return null;

  const label = service.includes ? "Includes" : "Features";
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">{label}</p>
      <ul className="grid sm:grid-cols-2 gap-2">
        {bullets.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-muted">
            <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddOnTable({
  title,
  items,
  note,
}: {
  title: string;
  items: PriceBookVolume["addOns"];
  note?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="stitch-card">
      <h2 className="font-display text-xl font-bold text-foreground mb-5">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stitch-outline text-left text-muted">
              <th className="pb-3 pr-4 font-medium">Service</th>
              <th className="pb-3 font-medium text-right">Price (LKR)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((addOn) => (
              <tr key={addOn.name} className="border-b border-stitch-outline/60 last:border-0">
                <td className="py-3 pr-4 text-foreground">{addOn.name}</td>
                <td className="py-3 text-right text-muted">{formatAddOnPrice(addOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? <p className="mt-4 text-xs text-muted">{note}</p> : null}
    </section>
  );
}

export function PriceBookVolumePage({
  volume,
  quoteInterest,
  heroDescription,
  ctaTitle,
  ctaDescription,
  ctaIcon: CtaIcon,
}: PriceBookVolumePageProps) {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow={volume.subtitle}
        title={volume.title}
        description={heroDescription}
        align="left"
      >
        <QuoteDialog formType="services" interest={quoteInterest} label="Request a Quote" />
      </PageHero>

      {volume.category ? (
        <p className="stitch-page-body -mt-4 mb-0 text-sm text-muted max-w-3xl">{volume.category}</p>
      ) : null}

      <div className="stitch-page-body stitch-stack-lg">
        {volume.services.map((service) => (
          <section key={service.slug} id={service.slug} className="stitch-card scroll-mt-28">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-stitch-glow mb-1">
                  Service {service.serviceNumber}
                </p>
                <h2 className="font-display text-2xl font-bold text-foreground">{service.name}</h2>
                {(service.delivery || service.warranty) && (
                  <p className="mt-2 text-xs text-muted">
                    {service.delivery ? `Delivery: ${service.delivery}` : null}
                    {service.delivery && service.warranty ? " · " : null}
                    {service.warranty ? `Warranty: ${service.warranty}` : null}
                  </p>
                )}
              </div>
              <QuoteDialog
                formType="services"
                interest={`${service.name} — ${volume.title}`}
                label="Get a Quote"
                variant="outline"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {service.packages.map((pkg, i) => (
                <div
                  key={pkg.tier}
                  className={cn(
                    "rounded-2xl border border-stitch-outline p-5",
                    i === 1 && "border-violet-400/40 bg-violet-500/[0.06]"
                  )}
                >
                  {i === 1 && (
                    <span className="inline-block text-[10px] font-mono uppercase tracking-wider bg-gradient-accent text-foreground px-2.5 py-0.5 rounded-full mb-3">
                      Popular
                    </span>
                  )}
                  <p className="text-sm font-medium text-muted">{pkg.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {formatPackagePrice(pkg)}
                  </p>
                </div>
              ))}
            </div>

            <ServiceIncludes service={service} />
            {service.note ? (
              <p className="mt-4 text-xs text-muted italic">{service.note}</p>
            ) : null}
          </section>
        ))}

        <AddOnTable title="Add-on Services" items={volume.addOns} />
        {volume.extraSections?.map((section) => (
          <AddOnTable
            key={section.title}
            title={section.title}
            items={section.items}
            note={section.note}
          />
        ))}
        {volume.domainAndHosting?.length ? (
          <AddOnTable title="Domain & Hosting" items={volume.domainAndHosting} />
        ) : null}

        <section className="stitch-card">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-5 w-5 text-stitch-glow" />
            <h2 className="font-display text-xl font-bold text-foreground">Delivery Timeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stitch-outline text-left text-muted">
                  <th className="pb-3 pr-4 font-medium">
                    {volume.deliveryTimeLabel ?? "Project Type"}
                  </th>
                  <th className="pb-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {volume.deliveryTimes.map((row) => (
                  <tr key={row.serviceType} className="border-b border-stitch-outline/60 last:border-0">
                    <td className="py-3 pr-4 text-foreground">{row.serviceType}</td>
                    <td className="py-3 text-muted">{row.delivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="stitch-card">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-stitch-glow" />
              <h2 className="font-display text-lg font-bold text-foreground">Payment Terms</h2>
            </div>
            <ul className="space-y-2">
              {volume.paymentTerms.map((term) => (
                <li key={term} className="flex gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                  {term}
                </li>
              ))}
            </ul>
          </section>

          <section className="stitch-card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-stitch-glow" />
              <h2 className="font-display text-lg font-bold text-foreground">Warranty &amp; Support</h2>
            </div>
            {volume.warrantyTable?.length ? (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stitch-outline text-left text-muted">
                      <th className="pb-2 pr-4 font-medium">
                        {volume.warrantyTypeLabel ?? "Service Type"}
                      </th>
                      <th className="pb-2 font-medium">Warranty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volume.warrantyTable.map((row) => (
                      <tr key={row.serviceType} className="border-b border-stitch-outline/60 last:border-0">
                        <td className="py-2 pr-4 text-foreground">{row.serviceType}</td>
                        <td className="py-2 text-muted">{row.warranty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {volume.warrantyCovers?.length ? (
              <>
                <p className="text-sm font-medium text-foreground mb-2">Warranty includes</p>
                <ul className="space-y-2 mb-4">
                  {volume.warrantyCovers.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted">
                      <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {volume.warrantyExcludes?.length ? (
              <>
                <p className="text-sm font-medium text-foreground mb-2">Not covered</p>
                <ul className="space-y-2">
                  {volume.warrantyExcludes.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted">
                      <span className="text-muted shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {volume.warrantyAndSupport.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted list-none">
                <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </section>
        </div>

        {volume.amc ? (
          <section className="stitch-card">
            <h2 className="font-display text-xl font-bold text-foreground mb-5">
              {volume.amc.title ?? "Annual Maintenance Contract (AMC)"}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {volume.amc.plans.map((plan, i) => (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-2xl border border-stitch-outline p-5",
                    i === 1 && "border-violet-400/40 bg-violet-500/[0.06]"
                  )}
                >
                  <p className="text-sm font-medium text-muted">{plan.name}</p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground">
                    {formatAddOnPrice(plan)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground mb-3">
              {volume.amc.includesLabel ?? "AMC includes"}
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {volume.amc.includes.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {volume.kpiReporting?.length ? (
          <section className="stitch-card">
            <h2 className="font-display text-xl font-bold text-foreground mb-5">
              Marketing KPIs &amp; Reporting
            </h2>
            <p className="text-sm text-muted mb-4">Every monthly client receives:</p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {volume.kpiReporting.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {volume.slaTargets?.length ? (
          <section className="stitch-card">
            <h2 className="font-display text-xl font-bold text-foreground mb-5">
              Service Level Targets
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stitch-outline text-left text-muted">
                    <th className="pb-3 pr-4 font-medium">Priority</th>
                    <th className="pb-3 pr-4 font-medium">Response Time</th>
                    <th className="pb-3 font-medium">Target Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {volume.slaTargets.map((row) => (
                    <tr key={row.priority} className="border-b border-stitch-outline/60 last:border-0">
                      <td className="py-3 pr-4 text-foreground">{row.priority}</td>
                      <td className="py-3 pr-4 text-muted">{row.responseTime}</td>
                      <td className="py-3 text-muted">{row.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {volume.benefitsSection ? (
          <section className="stitch-card">
            <h2 className="font-display text-xl font-bold text-foreground mb-5">
              {volume.benefitsSection.title}
            </h2>
            {volume.benefitsSection.subtitle ? (
              <p className="text-sm text-muted mb-4">{volume.benefitsSection.subtitle}</p>
            ) : null}
            <ul className="grid sm:grid-cols-2 gap-2">
              {volume.benefitsSection.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted">
                  <Check className="h-4 w-4 text-stitch-glow shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="stitch-card text-center !py-12 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <CtaIcon className="relative z-10 h-10 w-10 text-stitch-glow mx-auto mb-4" />
          <h2 className="relative z-10 font-display text-2xl font-bold text-foreground mb-3">
            {ctaTitle}
          </h2>
          <p className="relative z-10 text-muted mb-6 max-w-lg mx-auto">{ctaDescription}</p>
          <div className="relative z-10">
            <QuoteDialog formType="services" interest={quoteInterest} label="Request a Quote" />
          </div>
        </div>
      </div>
    </div>
  );
}
