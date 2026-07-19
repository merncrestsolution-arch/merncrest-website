import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { CatalogGrid } from "@/components/commerce/catalog-grid";
import { DomainSearch } from "@/components/domains/domain-search";

export default function DomainsPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Domains"
        title="Domain registration & DNS"
        description="Search, register, transfer, renew, and manage DNS for .lk, .com, .net, .org, and hundreds of TLDs."
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

      <div className="container-wide section-padding pt-10">
        <div className="mb-12 max-w-2xl mx-auto rounded-2xl border border-violet-500/20 bg-white/[0.03] p-5 shadow-glow">
          <DomainSearch />
        </div>

        <ul className="flex flex-wrap gap-2 mb-10 text-sm text-muted justify-center">
          {["Registration", "Transfer", "Renewal", "DNS", "WHOIS"].map((x) => (
            <li
              key={x}
              className="border border-white/10 bg-white/[0.02] px-3 py-1 rounded-full font-mono text-xs"
            >
              {x}
            </li>
          ))}
        </ul>
        <CatalogGrid category="domains" />
      </div>
    </div>
  );
}
