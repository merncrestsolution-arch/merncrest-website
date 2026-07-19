import { Link } from "@/i18n/routing";
import { pricingTiers } from "@/lib/data/pricing";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/ui/page-hero";

export default function PricingPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Pricing"
        title="Plans that grow with you"
        description="Start with hosting and websites, or go enterprise with custom ERP, CRM, and SLA support."
      />
      <div className="stitch-page-body">
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "relative flex h-full flex-col stitch-card",
                tier.featured && "border-violet-400/40 bg-violet-500/[0.07] shadow-glow"
              )}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider bg-gradient-accent text-white px-3 py-1 rounded-full">
                  Popular
                </span>
              )}
              <h2 className="font-display text-2xl font-bold text-white">{tier.name}</h2>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
              <p className="mt-6 font-display text-3xl font-bold text-white">
                {tier.price}
                <span className="text-base font-sans font-normal text-muted">{tier.period}</span>
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted">
                    <Check className="h-4 w-4 text-violet-300 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 w-full rounded-full"
                variant={tier.featured ? "default" : "outline"}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
