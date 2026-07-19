import { Link } from "@/i18n/routing";
import { downloads } from "@/lib/data/resources";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";

export default function DownloadsPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Downloads"
        title="Resources & downloads"
        description="Brochures, company profile, service catalog, whitepapers, and case study packs."
      />
      <div className="stitch-page-body">
        <div className="grid md:grid-cols-2 gap-5">
          {downloads.map((d) => (
            <div key={d.slug} className="stitch-card stitch-card-hover space-y-2">
              <p className="text-xs font-mono text-violet-300">
                {d.category} · {d.fileType}
              </p>
              <h2 className="font-display text-xl font-semibold text-white">{d.title}</h2>
              <p className="text-sm text-muted">{d.description}</p>
              <Button asChild variant="outline" size="sm" className="rounded-full mt-2">
                <Link href="/contact">Request download</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
