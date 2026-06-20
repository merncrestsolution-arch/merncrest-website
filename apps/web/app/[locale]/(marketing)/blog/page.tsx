import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { blogs } from "@/lib/data/blogs";
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
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-accent font-mono text-sm uppercase tracking-wider mb-3">
          Insights & News
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-display">
          Latest Tech Insights
        </h1>
        <p className="text-muted text-lg">
          Stay updated with the latest trends in software development, cloud computing, AI, and digital transformation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((post) => (
          <Link 
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group rounded-2xl overflow-hidden glass-card border border-white/5 hover:border-accent/30 transition-all hover:-translate-y-1 flex flex-col h-full"
          >
            <div className="relative h-56 overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={post.image} 
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 z-20">
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
                {post.title}
              </h3>
              <p className="text-muted text-sm line-clamp-3 mb-6 flex-grow">
                {post.excerpt}
              </p>
              <div className="flex items-center text-sm font-medium text-accent">
                Read Full Article
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
