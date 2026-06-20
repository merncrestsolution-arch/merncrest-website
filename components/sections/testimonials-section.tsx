"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote: "MERNcrest completely transformed our legacy ERP system. Their team's technical depth and agile approach helped us launch 2 months ahead of schedule.",
    author: "Samantha Perera",
    role: "CTO, Global Logistics Solutions",
    rating: 5
  },
  {
    quote: "The e-commerce app they built for us handles thousands of concurrent users flawlessly. A truly premium experience from start to finish.",
    author: "Mohammed Rizwan",
    role: "Founder, Trendz LK",
    rating: 5
  },
  {
    quote: "Their cybersecurity audit and subsequent implementations saved us from a major vulnerability. Highly professional and responsive team.",
    author: "David Chen",
    role: "Director of IT, SecureFin",
    rating: 5
  }
];

export function TestimonialsSection() {
  const tSection = useTranslations("testimonialsSnippet");

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative p-8 rounded-2xl glass-card border border-white/5 hover:border-white/10 transition-colors"
            >
              <Quote className="absolute top-6 right-6 h-12 w-12 text-accent/10 -z-10" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              
              <p className="text-muted leading-relaxed mb-8 italic">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-accent to-accent-alt flex items-center justify-center text-white font-bold shrink-0">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{testimonial.author}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
