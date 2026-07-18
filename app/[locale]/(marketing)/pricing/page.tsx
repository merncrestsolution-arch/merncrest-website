import { Link } from "@/i18n/routing";
import { pricingTiers } from "@/lib/data/pricing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mx-auto text-center mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Pricing</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Plans that grow with you</h1>
          <p className="mt-4 text-lg text-muted">
            Start with hosting and websites, or go enterprise with custom ERP, CRM, and SLA support.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-8",
                  tier.featured
                    ? "border-accent/50 bg-accent/5 shadow-glow"
                    : "border-white/10 bg-white/[0.02]"
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono uppercase tracking-wider bg-accent text-accent-foreground px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <h2 className="font-display text-2xl font-bold">{tier.name}</h2>
                <p className="mt-2 text-sm text-muted">{tier.description}</p>
                <p className="mt-6 font-display text-3xl font-bold">
                  {tier.price}
                  <span className="text-base font-sans font-normal text-muted">{tier.period}</span>
                </p>
                <ul className="mt-8 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={tier.featured ? "default" : "outline"}>
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
