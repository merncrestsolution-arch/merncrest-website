import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Database, Cloud, Layout, Shield, Cpu } from "lucide-react";

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
    techs: ["React.js", "Next.js", "Vue.js", "Tailwind CSS", "Framer Motion", "TypeScript"]
  },
  {
    title: "Backend & APIs",
    icon: Code2,
    description: "Building robust, scalable microservices and lightning-fast APIs.",
    techs: ["Node.js", "Express.js", "NestJS", "Python", "GraphQL", "REST APIs"]
  },
  {
    title: "Databases & Storage",
    icon: Database,
    description: "Architecting secure, high-availability data layers for enterprise apps.",
    techs: ["MongoDB", "PostgreSQL", "Redis", "Elasticsearch", "Prisma", "AWS S3"]
  },
  {
    title: "Cloud & DevOps",
    icon: Cloud,
    description: "Deploying infrastructure with zero downtime and infinite scalability.",
    techs: ["AWS", "Google Cloud", "Docker", "Kubernetes", "Vercel", "GitHub Actions"]
  },
  {
    title: "AI & Machine Learning",
    icon: Cpu,
    description: "Integrating intelligent algorithms to automate complex business logic.",
    techs: ["OpenAI API", "TensorFlow", "LangChain", "Vector Databases", "Python"]
  },
  {
    title: "Security & Testing",
    icon: Shield,
    description: "Ensuring ironclad protection and flawless code execution.",
    techs: ["Jest", "Cypress", "OAuth 2.0", "JWT", "SonarQube", "OWASP Standards"]
  }
];

export default async function TechnologiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Our Tech Stack
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 font-display text-balance">
          Powered by Cutting-Edge Technology
        </h1>
        <p className="text-muted text-lg">
          We carefully select the best tools for the job, ensuring your product is built on a foundation of performance, security, and limitless scalability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        {techCategories.map((category, i) => (
          <div key={i} className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-accent/30 transition-all group">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
              <category.icon className="h-7 w-7 text-accent" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{category.title}</h3>
            <p className="text-muted mb-8 leading-relaxed">
              {category.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {category.techs.map((tech, j) => (
                <span key={j} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/80 group-hover:border-white/20 transition-colors">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-12 rounded-3xl border border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent-alt/10" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Need a custom stack?</h2>
          <p className="text-muted text-lg mb-8">
            While these are our core technologies, our engineering team is highly adaptable. We can integrate with your existing infrastructure or build with specific frameworks upon request.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Discuss Your Project</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
