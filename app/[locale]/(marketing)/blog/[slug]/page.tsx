import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPostBySlug, getRelatedPosts, getAllPostSlugs } from "@/lib/cms";
import { formatBlogDate } from "@/lib/commerce-format";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";

export async function generateStaticParams() {
  // The database is not reachable during the Docker image build. Fall back to
  // an empty set so these pages are rendered on-demand at runtime instead of
  // failing the production build.
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || `${post.title} | MernCrest Blog`;
  const description = post.seoDescription || post.excerpt || undefined;
  return {
    title,
    description,
    alternates: { canonical: `https://merncrest.lk/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `https://merncrest.lk/blog/${post.slug}`,
      type: "article",
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.category, post.slug, 3);
  const dateLabel = formatBlogDate(post.publishedAt ?? post.createdAt);

  // A simple function to render markdown-like content safely for this demo
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">{line.replace('### ', '')}</h3>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-muted leading-relaxed mb-4 text-lg">{line}</p>;
    });
  };

  return (
    <article className="stitch-page pb-24">
      {/* Hero Header */}
      <div className="relative pt-32 pb-16 overflow-hidden border-b border-stitch-outline">
        <div className="absolute inset-0 z-0">
          {post.coverImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-stitch-bg/80 via-[var(--stitch-bg)] to-[var(--stitch-bg)]" />
        </div>
        
        <div className="stitch-container relative z-10">
          <Button asChild variant="ghost" className="mb-8 hover:bg-white/5 -ml-4">
            <Link href="/blog" className="text-muted hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
          
          <div className="max-w-3xl">
            <span className="px-3 py-1 text-sm font-semibold bg-accent/20 text-accent rounded-full border border-accent/20 mb-6 inline-block">
              {post.category}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 font-display text-balance leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-muted mb-8 leading-relaxed">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted border-t border-stitch-outline pt-6">
              {post.author && (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {post.author.charAt(0)}
                  </div>
                  <span className="font-medium text-foreground">{post.author}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {dateLabel}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime} min read
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="stitch-container stitch-section pt-10">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="stitch-card !p-8 sm:!p-12">
              {renderContent(post.bodyHtml)}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-5">
              <div className="stitch-card">
                <h3 className="font-display font-semibold text-lg mb-4 text-foreground">Share this article</h3>
                <ShareButton jobId={post.slug} />
              </div>

              {related.length > 0 && (
                <div className="stitch-card">
                  <h3 className="font-display font-semibold text-lg mb-4 text-foreground">Related articles</h3>
                  <ul className="space-y-4">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/blog/${r.slug}`}
                          className="group flex items-start gap-2 text-sm text-muted hover:text-foreground"
                        >
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-stitch-glow" />
                          <span className="line-clamp-2 group-hover:text-violet-200">{r.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="stitch-card">
                <h3 className="font-display font-semibold text-lg mb-4 text-foreground">About MernCrest</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  MernCrest Solutions (Pvt) Ltd builds enterprise software, cloud, and AI solutions,
                  and runs a domain &amp; hosting marketplace powered by provider partners.
                </p>
                <Button asChild className="w-full rounded-full">
                  <Link href="/contact">Work With Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
