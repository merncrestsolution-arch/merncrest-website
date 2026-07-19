import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { PageHero } from "@/components/ui/page-hero";

export default function HostingPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Hosting"
        title="Hosting built for growth"
        description="Shared, business, cPanel, VPS, dedicated, and AWS-backed hosting with SSL, backups, and 24/7 care."
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

      <div className="container-wide section-padding pt-10">
        <ul className="flex flex-wrap gap-2 mb-10 text-sm text-muted justify-center">
          {["Shared", "Business", "WordPress", "cPanel", "Cloud", "VPS", "Dedicated", "AWS"].map(
            (x) => (
              <li
                key={x}
                className="border border-white/10 bg-white/[0.02] px-3 py-1 rounded-full font-mono text-xs"
              >
                {x}
              </li>
            )
          )}
        </ul>
        <CatalogGrid category="hosting" />
      </div>
    </div>
  );
}
