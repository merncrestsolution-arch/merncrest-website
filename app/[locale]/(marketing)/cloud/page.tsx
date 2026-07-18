import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";

export default function CloudPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Cloud Solutions</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">AWS cloud & managed infrastructure</h1>
          <p className="mt-4 text-lg text-muted">
            Deployment, migration, server management, and cloud security — designed to scale with your business.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/contact">Talk to cloud experts</Link></Button>
            <Button asChild variant="outline"><Link href="/services/cloud-services">Service details</Link></Button>
          </div>
        </Reveal>
        <CatalogGrid category="cloud" />
      </div>
    </div>
  );
}
