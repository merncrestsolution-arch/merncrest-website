import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedPosts } from "@/lib/cms";
import { formatBlogDate } from "@/lib/commerce-format";
import { PageHero } from "@/components/ui/page-hero";
import { BlogSearch } from "@/components/blog/blog-search";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const title = `${t("blog")} | MernCrest Solutions`;
  const description =
    "Insights on software development, cloud, AI, and digital transformation from the MernCrest team.";
  return {
    title,
    description,
    alternates: { canonical: "https://merncrest.lk/blog" },
    openGraph: { title, description, url: "https://merncrest.lk/blog", type: "website" },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await getPublishedPosts();
  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Insights & News"
        title="Latest tech insights"
        description="Stay updated with the latest trends in software development, cloud computing, AI, and digital transformation."
      />

      <div className="stitch-page-body">
        {posts.length === 0 ? (
          <p className="text-center text-muted py-20">
            Articles are on the way. Check back soon.
          </p>
        ) : (
          <BlogSearch
            categories={categories}
            posts={posts.map((post) => ({
              id: post.id,
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt,
              category: post.category,
              author: post.author,
              coverImageUrl: post.coverImageUrl,
              date: formatBlogDate(post.publishedAt ?? post.createdAt),
            }))}
          />
        )}
      </div>
    </div>
  );
}
