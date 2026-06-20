import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { blogs } from "@/lib/data/blogs";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Calendar, User, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = blogs.find((p) => p.slug === slug);
  
  if (!post) {
    return {};
  }
  
  return {
    title: `${post.title} | MERNcrest Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const post = blogs.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // A simple function to render markdown-like content safely for this demo
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-bold mt-8 mb-4 text-white">{line.replace('### ', '')}</h3>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-muted leading-relaxed mb-4 text-lg">{line}</p>;
    });
  };

  return (
    <article className="min-h-screen pb-24">
      {/* Hero Header */}
      <div className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background" />
        </div>
        
        <div className="container-wide relative z-10">
          <Button asChild variant="ghost" className="mb-8 hover:bg-white/5 -ml-4">
            <Link href="/blog" className="text-muted hover:text-white">
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
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  {post.author.charAt(0)}
                </div>
                <span className="font-medium text-white">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="container-wide">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/5">
              {renderContent(post.content)}
            </div>
          </div>

          {/* Sidebar / Sharing */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8">
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg mb-4">Share this article</h3>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon" className="rounded-full hover:text-accent hover:border-accent">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full hover:text-[#1DA1F2] hover:border-[#1DA1F2]">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full hover:text-[#0A66C2] hover:border-[#0A66C2]">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </Button>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="font-bold text-lg mb-4">About MERNcrest</h3>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  MERNcrest Solutions (Pvt) Ltd is a leading software development and technology solutions provider in Sri Lanka. We specialize in custom software, cloud solutions, and digital transformation.
                </p>
                <Button asChild className="w-full">
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
