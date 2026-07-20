import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { BrandLogo, BrandStrip } from "@/components/ui/brand-logo";
import { techBrands } from "@/lib/data/resources";
import { Code2, Database, Cloud, Layout, Shield, Cpu } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("technologies")} | MERNcrest Solutions`,
  };
}

const techCategories = [
  {
    title: "Frontend Engineering",
    icon: Layout,
    description: "Creating highly interactive, beautiful, and performant user interfaces.",
    techs: ["React.js", "Next.js", "Vue.js", "Tailwind CSS", "Framer Motion", "TypeScript"],
  },
  {
    title: "Backend & APIs",
    icon: Code2,
    description: "Building robust, scalable microservices and lightning-fast APIs.",
    techs: ["Node.js", "Express.js", "NestJS", "Python", "GraphQL", "REST APIs"],
  },
  {
    title: "Databases & Storage",
    icon: Database,
    description: "Architecting secure, high-availability data layers for enterprise apps.",
    techs: ["MongoDB", "PostgreSQL", "Redis", "Elasticsearch", "Prisma", "AWS S3"],
  },
  {
    title: "Cloud & DevOps",
    icon: Cloud,
    description: "Deploying infrastructure with zero downtime and infinite scalability.",
    techs: ["AWS", "Google Cloud", "Docker", "Kubernetes", "Vercel", "GitHub Actions"],
  },
  {
    title: "AI & Machine Learning",
    icon: Cpu,
    description: "Integrating intelligent algorithms to automate complex business logic.",
    techs: ["OpenAI API", "TensorFlow", "LangChain", "Vector Databases", "Python"],
  },
  {
    title: "Security & Testing",
    icon: Shield,
    description: "Ensuring ironclad protection and flawless code execution.",
    techs: ["Jest", "Cypress", "OAuth 2.0", "JWT", "SonarQube", "OWASP Standards"],
  },
];

export default async function TechnologiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Our Tech Stack"
        title="Powered by cutting-edge technology"
        description="We carefully select the best tools for the job, ensuring your product is built on a foundation of performance, security, and limitless scalability."
      />

      <div className="stitch-page-body stitch-stack-lg">
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <div className="relative h-48 sm:h-56 md:h-64 w-full">
            <Image
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"
              alt="Cloud and satellite technology"
              fill
              className="object-cover opacity-70"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--stitch-bg)] via-[var(--stitch-bg)]/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-white/15">
                  <BrandLogo slug="amazonaws" name="AWS" color="FF9900" size={24} />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-white/15">
                  <BrandLogo slug="microsoft" name="Microsoft" color="00A4EF" size={24} />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-white/15">
                  <BrandLogo slug="googlecloud" name="Google Cloud" color="4285F4" size={24} />
                </div>
              </div>
              <p className="font-display text-lg sm:text-xl font-semibold text-white max-w-xl">
                Multi-cloud ready — AWS, Microsoft Azure, and Google Cloud architectures.
              </p>
            </div>
          </div>
        </div>

        <BrandStrip items={techBrands} className="py-2" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {techCategories.map((category) => (
            <div key={category.title} className="stitch-card stitch-card-hover group">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <category.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {category.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-6">{category.description}</p>
              <div className="flex flex-wrap gap-2">
                {category.techs.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="stitch-card text-center relative overflow-hidden !py-12">
          <div className="pointer-events-none absolute inset-0 brand-mesh opacity-50" aria-hidden />
          <div className="relative z-10 max-w-2xl mx-auto stitch-stack-md">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Need a custom stack?
            </h2>
            <p className="text-muted">
              While these are our core technologies, our engineering team is highly adaptable. We
              can integrate with your existing infrastructure or build with specific frameworks upon
              request.
            </p>
            <Button asChild size="lg" className="rounded-full mt-2">
              <Link href="/contact">Discuss Your Project</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
