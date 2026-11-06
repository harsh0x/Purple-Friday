import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock, Calendar, Tag } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";
import { BlogShareButtons } from "./BlogShareButtons";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return { title: "Story Not Found | Purple Friday" };
  }

  return {
    title: `${post.title} | Purple Friday Press Log`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Breadcrumb Header */}
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pf-violet hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Dispatches</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-pf-ink/60">
            <span className="font-bold text-pf-violet bg-pf-violet/10 px-2 py-0.5 border border-pf-violet/20 uppercase tracking-wider">
              {post.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.publishedAt}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Author Badge & Share Bar */}
          <div className="pt-4 border-t border-pf-ink/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-pf-ink bg-pf-violet text-white font-mono font-bold flex items-center justify-center text-sm shadow-[2px_2px_0_0_#15101F]">
                {post.author.avatarInitials}
              </div>
              <div>
                <span className="font-display text-sm font-bold text-pf-ink block">
                  {post.author.name}
                </span>
                <span className="font-mono text-xs text-pf-ink/60">{post.author.role}</span>
              </div>
            </div>

            <BlogShareButtons title={post.title} slug={post.slug} />
          </div>
        </div>
      </div>

      {/* Main Post Body */}
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <article className="border-2 border-pf-ink bg-white p-6 sm:p-12 shadow-[6px_6px_0_0_#15101F]">
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => (
                  <h2
                    className="font-display text-2xl sm:text-3xl font-extrabold text-pf-ink mt-8 mb-4 border-b-2 border-pf-ink/10 pb-2"
                    {...props}
                  />
                ),
                h2: ({ ...props }) => (
                  <h3
                    className="font-display text-xl sm:text-2xl font-bold text-pf-ink mt-6 mb-3"
                    {...props}
                  />
                ),
                p: ({ ...props }) => (
                  <p
                    className="font-sans text-sm sm:text-base text-pf-ink/80 leading-relaxed mb-4"
                    {...props}
                  />
                ),
                ul: ({ ...props }) => (
                  <ul
                    className="list-disc pl-6 font-sans text-sm text-pf-ink/80 space-y-2 mb-4"
                    {...props}
                  />
                ),
                ol: ({ ...props }) => (
                  <ol
                    className="list-decimal pl-6 font-sans text-sm text-pf-ink/80 space-y-2 mb-4"
                    {...props}
                  />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-bold text-pf-ink" {...props} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags Footer */}
          <div className="mt-12 pt-6 border-t-2 border-pf-ink/15 flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-pf-violet" />
            <span className="font-mono text-xs text-pf-ink/60 font-bold uppercase">
              Filed under:
            </span>
            {post.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-xs text-pf-ink bg-pf-paper px-2.5 py-1 border border-pf-ink/20"
              >
                #{t}
              </span>
            ))}
          </div>
        </article>

        {/* Related Posts */}
        <div className="mt-16">
          <div className="mb-6">
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Continue Reading
            </span>
            <h3 className="font-display text-2xl font-bold text-pf-ink mt-1">
              Related Atelier Dispatches
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedPosts.map((rel) => (
              <article
                key={rel.slug}
                className="border-2 border-pf-ink bg-white p-6 shadow-[4px_4px_0_0_#15101F] flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-pf-violet font-bold uppercase mb-2">
                    {rel.category}
                  </div>
                  <h4 className="font-display text-lg font-bold text-pf-ink leading-snug mb-2">
                    <Link href={`/blog/${rel.slug}`} className="hover:text-pf-violet">
                      {rel.title}
                    </Link>
                  </h4>
                  <p className="font-sans text-xs text-pf-ink/70 line-clamp-2">
                    {rel.excerpt}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-pf-ink/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-pf-ink/50">{rel.readTime}</span>
                  <Link
                    href={`/blog/${rel.slug}`}
                    className="font-bold text-pf-violet hover:underline flex items-center gap-1"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
