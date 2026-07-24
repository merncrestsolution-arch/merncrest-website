import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";
import { BrandStrip } from "@/components/ui/brand-logo";
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
        <div className="relative overflow-hidden rounded-xl border border-stitch-outline bg-[#0a1628]">
          <div className="relative w-full aspect-[16/7] sm:aspect-[21/8] min-h-[220px]">
            <Image
              src="/images/cloud-managed-infrastructure.png"
              alt="AWS Cloud and managed infrastructure — deployment, migration, security, and 24/7 support"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
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
