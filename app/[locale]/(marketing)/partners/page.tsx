import { Reveal } from "@/components/motion/reveal";
import { partners } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function PartnersPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Partners</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Technology partners</h1>
          <p className="mt-4 text-lg text-muted">
            We build on trusted platforms so your stack stays secure, scalable, and supportable.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {partners.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.04}>
              <div className="space-y-2">
                <h2 className="font-display text-xl font-semibold">{p.name}</h2>
                <p className="text-xs font-mono text-accent">{p.role}</p>
                <p className="text-sm text-muted">{p.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Button asChild>
          <Link href="/contact">Become a partner</Link>
        </Button>
      </div>
    </div>
  );
}
