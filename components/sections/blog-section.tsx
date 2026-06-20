"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";

const blogPosts = [
  {
    title: "The Future of Web Development: What to Expect in 2026",
    excerpt: "Explore the latest trends in server components, edge computing, and AI-driven UI generation.",
    author: "Jane Doe",
    date: "June 15, 2026",
    category: "Technology",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80"
  },
  {
    title: "How to Secure Your Enterprise Cloud Architecture",
    excerpt: "A comprehensive guide to implementing zero-trust security models in modern cloud deployments.",
    author: "John Smith",
    date: "June 10, 2026",
    category: "Security",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  },
  {
    title: "Maximizing ROI with Custom CRM Solutions",
    excerpt: "Why off-the-shelf CRMs might be holding your sales team back, and how custom software solves this.",
    author: "Sarah Connor",
    date: "June 5, 2026",
    category: "Business",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80"
  }
];

export function BlogSection() {
  const tSection = useTranslations("blogSnippet");
  const tCommon = useTranslations("common");

  return (
    <section className="relative py-16 md:py-24 bg-secondary/50 overflow-hidden border-t border-white/5">
      <div className="container-wide relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
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
          <Button asChild variant="outline" className="shrink-0 group hidden md:flex">
            <Link href="/blog">
              {tCommon("viewAll")} Posts
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-white/10 transition-colors flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <Image 
                  src={post.image} 
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 text-xs font-semibold bg-accent text-white rounded-full">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-4 text-xs text-muted mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {post.author}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors line-clamp-2">
                  <Link href={`/blog/${post.title.toLowerCase().replace(/\\s+/g, '-')}`}>
                    {post.title}
                  </Link>
                </h3>
                <p className="text-muted text-sm line-clamp-3 mb-6 flex-grow">
                  {post.excerpt}
                </p>
                <div className="flex items-center text-sm font-medium text-accent">
                  Read Article
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 md:hidden flex justify-center">
          <Button asChild variant="outline" className="group">
            <Link href="/blog">
              {tCommon("viewAll")} Posts
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
