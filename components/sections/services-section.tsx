"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Code2, 
  Smartphone, 
  Globe, 
  Cloud, 
  ShieldCheck, 
  Bot, 
  LineChart, 
  Lightbulb, 
  Server
} from "lucide-react";

const serviceIcons = {
  softwareDevelopment: Code2,
  webDevelopment: Globe,
  mobileAppDevelopment: Smartphone,
  cloudServices: Cloud,
  cyberSecurity: ShieldCheck,
  aiSolutions: Bot,
  digitalMarketing: LineChart,
  itConsulting: Lightbulb,
  hostingDomain: Server,
};

export function ServicesSection() {
  const t = useTranslations("servicesMenu");
  const tSection = useTranslations("servicesSnippet");
  const tCommon = useTranslations("common");

  const services = Object.keys(serviceIcons) as Array<keyof typeof serviceIcons>;

  return (
    <section className="relative py-24 bg-secondary/50">
      <div className="container-wide relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
            {tSection("badge")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {tSection("title")}
          </h2>
          <p className="text-muted">
            {tSection("description")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = serviceIcons[service];
            return (
              <motion.div
                key={service}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link 
                  href={`/services/${service.toLowerCase()}`}
                  className="group block h-full p-6 rounded-2xl glass-card hover:border-accent/30 transition-all hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-accent transition-colors">
                    {t(`${service}.title`)}
                  </h3>
                  <p className="text-sm text-muted mb-4">
                    {t(`${service}.description`)}
                  </p>
                  <div className="flex items-center text-sm font-medium text-accent">
                    {tCommon("learnMore")}
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/services">
              {tCommon("viewAll")} Services
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
