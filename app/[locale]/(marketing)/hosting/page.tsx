import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";
import { HostingRecommendWidget } from "@/components/hosting/hosting-recommend-widget";
import { StitchChip } from "@/components/ui/stitch";

export default function HostingPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Hosting Marketplace"
        title="Hosting packages from trusted providers"
        description="MernCrest resells shared, business, VPS, and cloud hosting via provider APIs — not our own servers. Activate after payment verification."
      >
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="rounded-full">
            <Link href="/pricing">View pricing</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/support">Support center</Link>
          </Button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <HostingRecommendWidget />
        <ul className="flex flex-wrap gap-2 justify-center">
          {["Shared", "Business", "WordPress", "cPanel", "Cloud", "VPS", "SSL", "Email"].map(
            (x) => (
              <li key={x}>
                <StitchChip>{x}</StitchChip>
              </li>
            )
          )}
        </ul>
        <CatalogGrid category="hosting" />
      </div>
    </div>
  );
}
