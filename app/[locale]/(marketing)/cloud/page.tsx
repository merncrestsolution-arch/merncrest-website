import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";

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
      <div className="stitch-page-body">
        <CatalogGrid category="cloud" />
      </div>
    </div>
  );
}
