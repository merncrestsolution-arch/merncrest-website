import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen } from "lucide-react";
import { priceBookCatalog } from "@/lib/data/price-book";

type PriceBookCatalogSectionProps = {
  title?: string;
  description?: string;
  showHubCta?: boolean;
};

export function PriceBookCatalogSection({
  title = "Master Price Book 2026–2027",
  description = "Official package pricing across all MernCrest services — 10 volumes, 200+ offerings with transparent LKR rates for quotations and proposals.",
  showHubCta = true,
}: PriceBookCatalogSectionProps) {
  return (
    <section className="stitch-card">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
        <div className="max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-wider text-stitch-glow mb-2">
            Official catalog
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h2>
          <p className="mt-3 text-sm text-muted leading-relaxed">{description}</p>
        </div>
        {showHubCta ? (
          <Link
            href="/services/price-book"
            className="inline-flex items-center gap-2 shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-stitch-glow hover:bg-violet-500/20 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            View full catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {priceBookCatalog.map((entry) => (
          <Link
            key={entry.slug}
            href={entry.href}
            className="group rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-5 py-4 transition-colors hover:border-violet-500/40"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-stitch-glow mb-1.5">
              Volume {String(entry.volume).padStart(2, "0")}
            </p>
            <h3 className="font-medium text-foreground leading-snug group-hover:text-stitch-glow transition-colors">
              {entry.title}
            </h3>
            <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">{entry.summary}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-stitch-glow">
              View pricing <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
