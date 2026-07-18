import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/components/commerce/catalog-grid";

export default function HostingPage() {
  return (
    <div className="pt-28 section-padding">
      <div className="container-wide">
        <Reveal className="max-w-2xl mb-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-3">Hosting</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Hosting built for growth</h1>
          <p className="mt-4 text-lg text-muted">
            Shared, business, cPanel, VPS, dedicated, and AWS-backed hosting with SSL, backups, and 24/7 care.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/pricing">View pricing</Link></Button>
            <Button asChild variant="outline"><Link href="/support">Support center</Link></Button>
          </div>
        </Reveal>
        <ul className="flex flex-wrap gap-2 mb-10 text-sm text-muted">
          {["Shared", "Business", "WordPress", "cPanel", "Cloud", "VPS", "Dedicated", "AWS"].map((x) => (
            <li key={x} className="border border-white/10 px-3 py-1 rounded-full font-mono text-xs">{x}</li>
          ))}
        </ul>
        <CatalogGrid category="hosting" />
      </div>
    </div>
  );
}
