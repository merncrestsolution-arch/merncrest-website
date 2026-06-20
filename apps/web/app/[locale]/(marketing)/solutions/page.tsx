import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { 
  ShoppingCart, Activity, GraduationCap, Landmark, 
  Building, Truck, Database, Users, Store, Calendar, 
  Cloud, Wifi, Brain, Lock, ArrowRight
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("solutions")} | MERNcrest Solutions`,
  };
}

const solutionsList = [
  { slug: "ecommerce", title: "E-Commerce", icon: ShoppingCart, desc: "High-conversion headless commerce platforms and secure storefronts." },
  { slug: "healthcare", title: "Healthcare Tech", icon: Activity, desc: "HIPAA-compliant telehealth, patient portals, and hospital management." },
  { slug: "education", title: "EdTech Platforms", icon: GraduationCap, desc: "Interactive Learning Management Systems (LMS) and virtual classrooms." },
  { slug: "fintech", title: "FinTech", icon: Landmark, desc: "Bank-grade security for digital wallets, trading platforms, and payments." },
  { slug: "realestate", title: "Real Estate", icon: Building, desc: "Immersive property listing platforms with CRM integrations." },
  { slug: "logistics", title: "Logistics", icon: Truck, desc: "Real-time fleet tracking, inventory, and route optimization software." },
  { slug: "erp", title: "ERP Systems", icon: Database, desc: "Centralized business operations from HR to finance to inventory." },
  { slug: "crm", title: "CRM Platforms", icon: Users, desc: "Custom CRM platforms tailored to your sales funnel to track leads." },
  { slug: "pos", title: "POS Systems", icon: Store, desc: "Cloud-based Point of Sale software for retail and restaurants." },
  { slug: "booking", title: "Booking Engines", icon: Calendar, desc: "Smart booking engines for hotels, salons, and events." },
  { slug: "saas", title: "SaaS Development", icon: Cloud, desc: "Multi-tenant platforms with built-in subscription billing systems." },
  { slug: "iot", title: "IoT Integrations", icon: Wifi, desc: "Cloud software that aggregates, visualizes, and controls hardware." },
  { slug: "aiml", title: "AI & Machine Learning", icon: Brain, desc: "Integrate LLMs and predictive analytics into your proprietary software." },
  { slug: "blockchain", title: "Blockchain & Web3", icon: Lock, desc: "Smart contracts, decentralized apps, and private blockchain implementations." }
];

export default async function SolutionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Industry Expertise
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-display text-balance tracking-tight">
          Software Solutions for Every Industry
        </h1>
        <p className="text-xl text-muted leading-relaxed">
          From disruptive startups to global enterprises, we build bespoke digital platforms tailored to the exact regulatory and operational needs of your specific industry.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {solutionsList.map((sol, i) => {
          const Icon = sol.icon;
          return (
            <Link 
              key={sol.slug} 
              href={`/solutions/${sol.slug}`}
              className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-accent/50 hover:bg-white/[0.02] transition-all group flex flex-col h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                <ArrowRight className="h-5 w-5 text-accent" />
              </div>
              
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-accent transition-colors">
                {sol.title}
              </h3>
              
              <p className="text-muted text-sm leading-relaxed flex-grow">
                {sol.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
