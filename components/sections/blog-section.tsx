"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";
import {
  StitchSection,
  StitchHeader,
  StitchCard,
  StitchReveal,
  StitchGrid,
} from "@/components/ui/stitch";

const blogPosts = [
  {
    title: "The Future of Web Development: What to Expect in 2026",
    excerpt:
      "Explore the latest trends in server components, edge computing, and AI-driven UI generation.",
    author: "Jane Doe",
    date: "June 15, 2026",
    category: "Technology",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1472&q=80",
  },
  {
    title: "How to Secure Your Enterprise Cloud Architecture",
    excerpt:
      "A comprehensive guide to implementing zero-trust security models in modern cloud deployments.",
    author: "John Smith",
    date: "June 10, 2026",
    category: "Security",
    image:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  },
  {
    title: "Maximizing ROI with Custom CRM Solutions",
    excerpt:
      "Why off-the-shelf CRMs might be holding your sales team back, and how custom software solves this.",
    author: "Sarah Connor",
    date: "June 5, 2026",
    category: "Business",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
  },
];

export function BlogSection() {
  const tSection = useTranslations("blogSnippet");
  const tCommon = useTranslations("common");

  return (
    <StitchSection className="border-t border-white/[0.05]">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <StitchHeader
          eyebrow={tSection("badge")}
          title={tSection("title")}
          description={tSection("description")}
        />
        <Button asChild variant="outline" className="shrink-0 hidden md:inline-flex rounded-full">
          <Link href="/blog">
            {tCommon("viewAll")} Posts
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <StitchGrid cols={3}>
        {blogPosts.map((post, index) => (
          <StitchReveal key={post.title} delay={index * 0.06}>
            <StitchCard className="h-full overflow-hidden !p-0 flex flex-col">
              <div className="relative h-44 w-full overflow-hidden">
                <Image src={post.image} alt={post.title} fill className="object-cover opacity-80" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-[11px] font-mono uppercase tracking-wider text-violet-300 mb-2">
                  {post.category}
                </p>
                <h3 className="font-display text-lg font-semibold text-white mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" /> {post.author}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {post.date}
                  </span>
                </div>
              </div>
            </StitchCard>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
