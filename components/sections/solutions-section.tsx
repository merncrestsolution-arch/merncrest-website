"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Wallet,
  Building2,
  Truck,
  Database,
  Users,
  Store,
  CalendarCheck,
  Cloud,
  Cpu,
  BrainCircuit,
  Boxes
} from "lucide-react";

const solutionIcons = {
  ecommerce: ShoppingCart,
  healthcare: HeartPulse,
  education: GraduationCap,
  fintech: Wallet,
  realEstate: Building2,
  logistics: Truck,
  erp: Database,
  crm: Users,
  pos: Store,
  booking: CalendarCheck,
  saas: Cloud,
  iot: Cpu,
  aiml: BrainCircuit,
  blockchain: Boxes,
};

export function SolutionsSection() {
  const t = useTranslations("solutionsMenu");
  const tSection = useTranslations("solutionsSnippet");
  const tCommon = useTranslations("common");

  // We'll only show a subset on the home page
  const featuredSolutions = [
    "ecommerce",
    "healthcare",
    "fintech",
    "education",
    "erp",
    "aiml"
  ] as Array<keyof typeof solutionIcons>;

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-alt/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <motion.div 
            className="lg:col-span-5 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
              {tSection("badge")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
              {tSection("title")}
            </h2>
            <p className="text-muted text-lg mb-8">
              {tSection("description")}
            </p>
            
            <Button asChild size="lg" className="group">
              <Link href="/solutions">
                {tCommon("viewAll")} Solutions
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>

          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredSolutions.map((solution, index) => {
                const Icon = solutionIcons[solution];
                return (
                  <motion.div
                    key={solution}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Link 
                      href={`/solutions/${solution.toLowerCase()}`}
                      className="group flex items-start gap-4 p-5 rounded-2xl glass-card border border-white/5 hover:border-accent/30 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 group-hover:text-accent transition-colors">
                          {t(`${solution}.title`)}
                        </h4>
                        <p className="text-sm text-muted line-clamp-2">
                          {t(`${solution}.description`)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
