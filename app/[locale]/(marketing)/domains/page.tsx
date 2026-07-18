import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";

export default function DomainsPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Domains</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Domain registration & DNS</h1>
          <p className="mt-4 text-lg text-muted">
            Search, register, transfer, renew, and manage DNS for .lk, .com, .net, .org, and hundreds of TLDs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/register">Get Started</Link></Button>
            <Button asChild variant="outline"><Link href="/knowledge-base">Domain guides</Link></Button>
          </div>
        </Reveal>
        <ul className="flex flex-wrap gap-2 mb-10 text-sm text-muted">
          {["Registration", "Transfer", "Renewal", "DNS", "WHOIS"].map((x) => (
            <li key={x} className="border border-white/10 px-3 py-1 rounded-full font-mono text-xs">{x}</li>
          ))}
        </ul>
        <CatalogGrid category="domains" />
      </div>
    </div>
  );
}
