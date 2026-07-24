import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { downloads } from "@/lib/data/resources";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Download, FileText, Lock } from "lucide-react";

export const metadata = {
  title: "Downloads | MernCrest",
  description:
    "Company profile, brochures, guides, and customer resources. Invoices and licensed assets are available in your customer portal.",
};

/** Publicly available assets uploaded by admins (not tied to a specific user). */
async function getPublicAssets() {
  try {
    return await prisma.customerDownload.findMany({
      where: { userId: null, active: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, description: true, category: true, fileUrl: true, fileType: true },
    });
  } catch {
    return [];
  }
}

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const publicAssets = await getPublicAssets();

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Downloads"
        title="Resources & downloads"
        description="Company profile, brochures, and guides. Your invoices, receipts, and licensed assets live securely in your customer portal."
      />
      <div className="stitch-page-body stitch-stack-lg">
        {publicAssets.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Available now</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {publicAssets.map((d) => (
                <div key={d.id} className="stitch-card stitch-card-hover space-y-2">
                  <p className="text-xs font-mono text-stitch-glow">
                    {d.category}
                    {d.fileType ? ` · ${d.fileType}` : ""}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-foreground">{d.title}</h3>
                  {d.description && <p className="text-sm text-muted">{d.description}</p>}
                  <Button asChild variant="outline" size="sm" className="rounded-full mt-2">
                    <a href={d.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Request a document</h2>
          <p className="text-sm text-muted mb-6 max-w-2xl">
            These are prepared on request so you always get the latest version. Tell us which one you
            need and we&apos;ll send it over.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {downloads.map((d) => (
              <div key={d.slug} className="stitch-card stitch-card-hover space-y-2">
                <p className="text-xs font-mono text-stitch-glow flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {d.category} · {d.fileType}
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground">{d.title}</h3>
                <p className="text-sm text-muted">{d.description}</p>
                <Button asChild variant="outline" size="sm" className="rounded-full mt-2">
                  <Link href={`/contact?doc=${d.slug}`}>Request this document</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="stitch-card relative overflow-hidden !py-12 text-center">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          <div className="relative z-10 mx-auto max-w-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-stitch-glow">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Customer downloads
            </h2>
            <p className="text-muted mb-7">
              Invoices, receipts, and licensed project files are available to signed-in customers in
              the portal.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link href="/portal/downloads">Go to portal downloads</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login">Client login</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
