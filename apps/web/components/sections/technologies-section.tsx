"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const technologies = [
  { category: "Frontend", skills: ["React", "Next.js", "Vue.js", "Tailwind CSS", "TypeScript"] },
  { category: "Backend", skills: ["Node.js", "Express", "Python", "NestJS", "Java"] },
  { category: "Database", skills: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase"] },
  { category: "DevOps & Cloud", skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Azure"] },
  { category: "Mobile", skills: ["React Native", "Flutter", "Swift", "Kotlin"] }
];

export function TechnologiesSection() {
  const tSection = useTranslations("techSnippet");

  return (
    <section className="relative py-24 bg-secondary/30 border-y border-black/5 dark:border-white/5 overflow-hidden">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {technologies.map((techGroup, index) => (
            <motion.div
              key={techGroup.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-6 rounded-2xl hover:border-accent/30 dark:hover:border-accent/30 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white">
                {techGroup.category}
              </h3>
              <ul className="space-y-3">
                {techGroup.skills.map((skill) => (
                  <li key={skill} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
