import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";
import { BrandLogo, BrandStrip } from "@/components/ui/brand-logo";
import { techBrands } from "@/lib/data/resources";

export default function CloudPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Cloud Solutions"
        title="AWS cloud & managed infrastructure"
        description="Deployment, migration, server management, and cloud security — designed to scale with your business."
      >
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="rounded-full">
            <Link href="/contact">Talk to cloud experts</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/services/cloud-services">Service details</Link>
          </Button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <div className="relative h-52 sm:h-64 w-full">
            <Image
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"
              alt="Earth from space — cloud infrastructure"
              fill
              className="object-cover opacity-75"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--stitch-bg)] via-[var(--stitch-bg)]/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 border border-white/15">
                  <BrandLogo slug="amazonaws" name="AWS" color="FF9900" size={26} />
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 border border-white/15">
                  <BrandLogo slug="microsoftazure" name="Azure" color="0078D4" size={26} />
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/45 border border-white/15">
                  <BrandLogo slug="googlecloud" name="Google Cloud" color="4285F4" size={26} />
                </div>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Built on AWS, Azure & Google Cloud
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Multi-provider cloud consulting — we orchestrate provider platforms; we do not own
                datacenters.
              </p>
            </div>
          </div>
        </div>

        <BrandStrip
          items={techBrands.filter((b) =>
            ["amazonaws", "microsoft", "googlecloud", "docker", "kubernetes"].includes(b.slug)
          )}
        />

        <CatalogGrid category="cloud" />
      </div>
    </div>
  );
}
