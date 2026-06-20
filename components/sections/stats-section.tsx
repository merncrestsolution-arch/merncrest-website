"use client";

import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRef, useEffect, useState } from "react";

function Counter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * (to - from) + from));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, from, to, duration]);

  return <span ref={nodeRef}>{count}</span>;
}

export function StatsSection() {
  const tSection = useTranslations("statsSnippet");

  const stats = [
    { value: 50, suffix: "+", label: "Projects Delivered" },
    { value: 30, suffix: "+", label: "Happy Clients" },
    { value: 5, suffix: "+", label: "Years Experience" },
    { value: 99, suffix: "%", label: "Client Retention" },
  ];

  return (
    <section className="relative py-16 md:py-24 bg-accent/5 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center mix-blend-overlay opacity-5" />
      
      <div className="container-wide relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
            {tSection("badge")}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {tSection("title")}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6 glass-card rounded-2xl"
            >
              <div className="text-4xl sm:text-5xl font-bold text-accent mb-2 font-display">
                <Counter from={0} to={stat.value} />
                {stat.suffix}
              </div>
              <div className="text-sm sm:text-base font-medium text-muted">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
