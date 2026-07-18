import { Reveal } from "@/components/motion/reveal";
import { downloads } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function DownloadsPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-14">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Downloads</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Resources & downloads</h1>
          <p className="mt-4 text-lg text-muted">
            Brochures, company profile, service catalog, whitepapers, and case study packs.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-8">
          {downloads.map((d, i) => (
            <Reveal key={d.slug} delay={i * 0.04}>
              <div className="border-b border-white/10 pb-8 space-y-2">
                <p className="text-xs font-mono text-accent">{d.category} · {d.fileType}</p>
                <h2 className="font-display text-xl font-semibold">{d.title}</h2>
                <p className="text-sm text-muted">{d.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/contact">Request download</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
