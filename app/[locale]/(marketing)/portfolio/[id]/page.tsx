import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Building2 } from "lucide-react";
import { portfolioProjects } from "@/lib/portfolio";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const project = portfolioProjects.find(p => p.id === id);
  if (!project) return {};

  return { title: `${project.title} | Case Study | MERNcrest Solutions` };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const project = portfolioProjects.find(p => p.id === id);
  if (!project) notFound();

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container-wide pt-32 pb-8">
        <Link 
          href="/portfolio" 
          className="inline-flex items-center gap-2 text-muted hover:text-accent transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </Link>
      </div>

      {/* Hero Section */}
      <section className="container-wide mb-16 lg:mb-24">
        <div className="max-w-4xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 uppercase tracking-wider">
            {project.category}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 font-display text-balance tracking-tight">
            {project.title}
          </h1>
          <p className="text-xl lg:text-2xl text-muted leading-relaxed max-w-3xl">
            {project.overview}
          </p>
        </div>

        {/* Key Info Bar */}
        <div className="flex flex-wrap items-center gap-6 p-6 rounded-2xl glass-card border border-white/5 mb-16">
          {project.client && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider">Client</p>
                <p className="font-semibold">{project.client}</p>
              </div>
            </div>
          )}
          
          {project.client && project.duration && <div className="w-px h-10 bg-white/10 hidden sm:block" />}
          
          {project.duration && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-wider">Duration</p>
                <p className="font-semibold">{project.duration}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hero Image */}
        <div className="relative w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10" />
          <Image 
            src={project.image} 
            alt={project.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="container-wide mb-24">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-24">
          
          {/* Left Content (Challenge & Solution) */}
          <div className="lg:col-span-2 space-y-16">
            <div>
              <h2 className="text-3xl font-bold mb-6 font-display">The Challenge</h2>
              <div className="p-8 rounded-2xl bg-destructive/5 border border-destructive/10 text-muted leading-relaxed text-lg">
                {project.challenge}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6 font-display">Our Solution</h2>
              <div className="p-8 rounded-2xl bg-accent/5 border border-accent/10 text-muted leading-relaxed text-lg">
                {project.solution}
              </div>
            </div>
          </div>

          {/* Right Content (Tech Stack & Results) */}
          <div className="space-y-12">
            {/* Results / Impact */}
            <div className="glass-card p-8 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] rounded-full" />
              <h3 className="text-2xl font-bold mb-8 relative z-10">Project Impact</h3>
              <div className="space-y-6 relative z-10">
                {project.results.map((result, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-4xl font-black text-accent tracking-tighter mb-1">
                      {result.value}
                    </span>
                    <span className="text-sm font-medium text-muted uppercase tracking-wider">
                      {result.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div>
              <h3 className="text-xl font-bold mb-6">Technologies Used</h3>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech, i) => (
                  <span 
                    key={i} 
                    className="px-4 py-2 bg-secondary rounded-lg border border-white/5 font-mono text-sm text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="container-wide pb-32">
        <div className="glass-card p-12 lg:p-20 rounded-[3rem] border border-accent/20 bg-accent/5 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/20 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 font-display relative z-10 text-balance">
            Ready to build something extraordinary?
          </h2>
          <p className="text-xl text-muted mb-10 max-w-2xl mx-auto relative z-10">
            Let's discuss how our expert engineering team can transform your business ideas into reality.
          </p>
          <Button asChild size="lg" className="h-14 px-8 text-base relative z-10 shadow-[0_0_30px_rgba(var(--accent),0.3)]">
            <Link href="/contact">Start Your Project <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
