import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { blogs } from "@/lib/data/blogs";
import { PageHero } from "@/components/ui/page-hero";
import { Calendar, User, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("blog")} | MERNcrest Solutions`,
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <PageHero
        eyebrow="Insights & News"
        title="Latest tech insights"
        description="Stay updated with the latest trends in software development, cloud computing, AI, and digital transformation."
      />

      <div className="stitch-page-body">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group stitch-card stitch-card-hover !p-0 overflow-hidden flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
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
                <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-violet-200 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-muted text-sm line-clamp-3 mb-6 flex-grow">{post.excerpt}</p>
                <div className="flex items-center text-sm font-medium text-violet-300">
                  Read Full Article
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
