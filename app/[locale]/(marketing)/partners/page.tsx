import { Link } from "@/i18n/routing";
import { partners } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";

export default function PartnersPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Partners"
        title="Technology partners"
        description="We build on trusted platforms so your stack stays secure, scalable, and supportable."
      />
      <div className="stitch-page-body">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {partners.map((p) => (
            <div key={p.name} className="stitch-card stitch-card-hover">
              <h2 className="font-display text-xl font-semibold text-white">{p.name}</h2>
              <p className="mt-1 text-xs font-mono text-violet-300">{p.role}</p>
              <p className="mt-2 text-sm text-muted">{p.blurb}</p>
            </div>
          ))}
        </div>
        <Button asChild className="rounded-full">
          <Link href="/contact">Become a partner</Link>
        </Button>
      </div>
    </div>
  );
}
