import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Clock, Building2 } from "lucide-react";
import { getCaseStudyBySlug, getAllCaseStudySlugs } from "@/lib/cms";
import { caseStudyTech, caseStudyResults } from "@/lib/portfolio";
import Image from "next/image";

export async function generateStaticParams() {
  // DB is unreachable during the Docker image build; render on-demand instead.
  try {
    const slugs = await getAllCaseStudySlugs();
    return slugs.map((id) => ({ id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const study = await getCaseStudyBySlug(id);
  if (!study) return {};

  const title = study.seoTitle || `${study.title} | Case Study | MernCrest Solutions`;
  const description = study.seoDescription || study.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: `https://merncrest.lk/portfolio/${study.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: study.coverImageUrl ? [{ url: study.coverImageUrl }] : undefined,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const study = await getCaseStudyBySlug(id);
  if (!study) notFound();

  const project = {
    title: study.title,
    category: study.industry || study.category,
    overview: study.excerpt || study.problem || "",
    challenge: study.problem || "",
    solution: study.solution || "",
    client: study.clientName,
    duration: study.duration,
    image: study.coverImageUrl,
    tech: caseStudyTech(study),
    results: caseStudyResults(study),
  };

  return (
    <div className="stitch-page">
      {/* Back Button */}
      <div className="stitch-container pt-32 pb-8">
        <Link 
          href="/portfolio" 
          className="inline-flex items-center gap-2 text-muted hover:text-stitch-glow transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className="stitch-container mb-16 lg:mb-24">
        <div className="max-w-4xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-stitch-glow text-sm font-medium mb-6 uppercase tracking-wider border border-violet-500/20">
            {project.category}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-display text-balance tracking-tight text-foreground">
            {project.title}
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-3xl">
            {project.overview}
          </p>
        </div>

        {/* Key Info Bar */}
        <div className="flex flex-wrap items-center gap-6 stitch-card mb-12">
          {project.client && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-stitch-glow" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider">Client</p>
                <p className="font-semibold text-foreground">{project.client}</p>
              </div>
            </div>
          )}
          
          {project.client && project.duration && <div className="w-px h-10 bg-white/10 hidden sm:block" />}
          
          {project.duration && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-stitch-glow" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider">Duration</p>
                <p className="font-semibold text-foreground">{project.duration}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hero Image */}
        {project.image && (
          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden border border-stitch-outline">
            <div className="absolute inset-0 bg-gradient-to-t from-stitch-bg/40 to-transparent z-10" />
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="stitch-container mb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Content (Challenge & Solution) */}
          <div className="lg:col-span-2 space-y-10">
            {project.challenge && (
              <div>
                <h2 className="text-2xl font-bold mb-5 font-display text-foreground">The Challenge</h2>
                <div className="stitch-card text-muted leading-relaxed border-red-500/15 bg-red-500/[0.04]">
                  {project.challenge}
                </div>
              </div>
            )}

            {project.solution && (
              <div>
                <h2 className="text-2xl font-bold mb-5 font-display text-foreground">Our Solution</h2>
                <div className="stitch-card text-muted leading-relaxed border-violet-500/15 bg-violet-500/[0.04]">
                  {project.solution}
                </div>
              </div>
            )}
          </div>

          {/* Right Content (Tech Stack & Results) */}
          <div className="space-y-6">
            {/* Results / Impact */}
            {project.results.length > 0 && (
              <div className="stitch-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[50px] rounded-full" />
                <h3 className="text-xl font-bold mb-6 relative z-10 text-foreground">Project Impact</h3>
                <div className="space-y-5 relative z-10">
                  {project.results.map((result, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-3xl font-black text-stitch-glow tracking-tighter mb-1">
                        {result.value}
                      </span>
                      <span className="text-sm font-medium text-muted uppercase tracking-wider">
                        {result.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tech Stack */}
            {project.tech.length > 0 && (
            <div className="stitch-card">
              <h3 className="text-lg font-bold mb-4 text-foreground">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 rounded-full border border-stitch-outline bg-white/[0.03] font-mono text-xs text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            )}
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="stitch-container pb-24">
        <div className="stitch-card !py-14 text-center relative overflow-hidden border-violet-500/20 bg-violet-500/[0.05]">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-40" />
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-display relative z-10 text-balance text-foreground">
            Ready to build something extraordinary?
          </h2>
          <p className="text-muted mb-8 max-w-2xl mx-auto relative z-10">
            Let&apos;s discuss how our expert engineering team can transform your business ideas into reality.
          </p>
          <Button asChild size="lg" className="rounded-full relative z-10">
            <Link href="/contact">Start Your Project <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
