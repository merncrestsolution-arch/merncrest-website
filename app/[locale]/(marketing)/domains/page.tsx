import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { DomainSearch } from "@/components/domains/domain-search";
import { StitchChip } from "@/components/ui/stitch";

export default function DomainsPage() {
  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Domain Marketplace"
        title="Search, register & transfer domains"
        description="Domain availability and pricing come from our reseller provider network. Register, renew, transfer, and manage DNS — MernCrest is not a domain registrar."
      >
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild className="rounded-full">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/knowledge-base">Domain guides</Link>
          </Button>
        </div>
      </PageHero>

      <div className="stitch-page-body stitch-stack-lg">
        <div className="max-w-2xl mx-auto stitch-card shadow-glow border-violet-500/20">
          <DomainSearch />
        </div>

        <ul className="flex flex-wrap gap-2 justify-center">
          {["Registration", "Transfer", "Renewal", "DNS", "WHOIS"].map((x) => (
            <li key={x}>
              <StitchChip>{x}</StitchChip>
            </li>
          ))}
        </ul>

        <CatalogGrid category="domains" />
      </div>
    </div>
  );
}
