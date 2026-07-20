import Image from "next/image";
import { Link } from "@/i18n/routing";
import { partners } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function PartnersPage() {
  const featured = partners.filter((p) => p.image);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Partners"
        title="Technology partners"
        description="We build on trusted platforms so your stack stays secure, scalable, and supportable."
      />
      <div className="stitch-page-body stitch-stack-lg">
        {featured.length > 0 && (
          <div className="grid md:grid-cols-3 gap-5">
            {featured.slice(0, 3).map((p) => (
              <article
                key={p.name}
                className="stitch-card stitch-card-hover !p-0 overflow-hidden flex flex-col"
              >
                <div className="relative h-40 w-full bg-white/[0.03]">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={`${p.name} technology`}
                      fill
                      className="object-cover opacity-80"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--stitch-bg)] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-black/50 border border-white/15 backdrop-blur-sm">
                    <BrandLogo
                      slug={p.slug}
                      name={p.name}
                      color={p.color}
                      size={26}
                    />
                  </div>
                </div>
                <div className="p-6 pt-4">
                  <h2 className="font-display text-xl font-semibold text-white">{p.name}</h2>
                  <p className="mt-1 text-xs font-mono text-violet-300">{p.role}</p>
                  <p className="mt-2 text-sm text-muted">{p.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {partners.map((p) => (
            <div key={p.name} className="stitch-card stitch-card-hover flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
                <BrandLogo slug={p.slug} name={p.name} color={p.color} size={28} />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">{p.name}</h2>
                <p className="mt-0.5 text-xs font-mono text-violet-300">{p.role}</p>
                <p className="mt-2 text-sm text-muted">{p.blurb}</p>
              </div>
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
