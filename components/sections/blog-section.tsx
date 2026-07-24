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

type HomeBlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  date: string;
  category: string;
  image: string | null;
};

export function BlogSection({ posts = [] }: { posts?: HomeBlogPost[] }) {
  const tSection = useTranslations("blogSnippet");
  const tCommon = useTranslations("common");

  if (posts.length === 0) return null;

  return (
    <StitchSection className="border-t border-stitch-outline">
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
        {posts.map((post, index) => (
          <StitchReveal key={post.slug} delay={index * 0.06}>
            <Link href={`/blog/${post.slug}`}>
              <StitchCard className="h-full overflow-hidden !p-0 flex flex-col">
                <div className="relative h-44 w-full overflow-hidden bg-white/5">
                  {post.image && (
                    <Image src={post.image} alt={post.title} fill className="object-cover opacity-80" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-stitch-glow mb-2">
                    {post.category}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted line-clamp-2 flex-1">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                    {post.author && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> {post.author}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {post.date}
                    </span>
                  </div>
                </div>
              </StitchCard>
            </Link>
          </StitchReveal>
        ))}
      </StitchGrid>
    </StitchSection>
  );
}
