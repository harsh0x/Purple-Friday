"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { BookOpen, Clock, Tag, ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blog-data";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { CmsBlogPost } from "@/server/cms/schema";

function BlogListContent() {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [posts, setPosts] = useState(BLOG_POSTS);

  useEffect(() => {
    async function loadCmsPosts() {
      try {
        const res = await fetch("/api/cms");
        if (res.ok) {
          const data = await res.json();
          if (data.cms?.blogPosts && Array.isArray(data.cms.blogPosts)) {
            const cmsItems = data.cms.blogPosts
              .filter((p: { published?: boolean }) => p.published !== false)
              .map((p: CmsBlogPost) => ({
                slug: p.slug,
                title: p.title,
                category: p.tags?.[0] || "Print Atelier",
                excerpt: p.excerpt,
                content: p.contentMarkdown,
                readTime: `${p.readingTimeMinutes || 4} min read`,
                publishedAt: new Date(p.publishedAt).toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                author: {
                  name: p.authorName || "Purple Friday Atelier",
                  role: "Head of Pre-Press & Typography",
                  avatarInitials: (p.authorName || "PF")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                },
                tags: p.tags || ["Dispatch"],
              }));

            // Merge with existing fallback posts (avoid duplicate slugs)
            const combined = [...cmsItems];
            for (const fallback of BLOG_POSTS) {
              if (!combined.some((c) => c.slug === fallback.slug)) {
                combined.push(fallback);
              }
            }
            setPosts(combined);
          }
        }
      } catch {
        // fallback
      }
    }
    loadCmsPosts();
  }, []);

  const allTags = ["All", ...Array.from(new Set(posts.flatMap((p) => p.tags)))];

  const filteredPosts =
    selectedTag === "All"
      ?posts
  : posts.filter((p) => p.tags.includes(selectedTag));

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* Header */}
      <div className="border-b-2 border-pf-ink bg-white py-14 px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 border border-pf-ink/20 bg-pf-ink/5 px-3 py-1 text-xs font-mono font-medium text-pf-ink uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5 text-pf-violet" />
            The Press Log & Atelier Journal
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink">
            Dispatches from the Print Floor
          </h1>
          <p className="text-sm font-sans text-pf-ink/75 max-w-xl mx-auto">
            Technical guides on ink chemistry, vector pre-press tolerances, textile wash durability, and corporate swag case studies.
          </p>

          {/* Tag Filter Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <span className="font-mono text-xs text-pf-ink/60 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Filter by topic:
            </span>
            {allTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`font-mono text-xs px-3 py-1 border transition-all ${isActive
                      ? "border-pf-ink bg-pf-violet text-white font-bold shadow-[2px_2px_0_0_#15101F]"
                      : "border-pf-ink/20 bg-white text-pf-ink hover:border-pf-ink"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="border-2 border-pf-ink bg-white p-6 sm:p-8 shadow-[5px_5px_0_0_#15101F] flex flex-col justify-between hover:-translate-y-1 transition-transform"
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs text-pf-ink/70 mb-3 pb-3 border-b border-pf-ink/10">
                  <span className="font-bold uppercase text-pf-violet tracking-wider">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold text-pf-ink leading-tight mb-3">
                  <Link href={`/blog/${post.slug}`} className="hover:text-pf-violet transition-colors">
                    {post.title}
                  </Link>
                </h2>

                <p className="font-sans text-xs sm:text-sm text-pf-ink/75 leading-relaxed mb-6">
                  {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="font-mono text-[10px] text-pf-ink/70 bg-pf-paper px-2 py-0.5 border border-pf-ink/15"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Author & Read Link */}
              <div className="pt-4 border-t border-pf-ink/15 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full border border-pf-ink bg-pf-violet text-white text-[11px] font-bold flex items-center justify-center">
                    {post.author.avatarInitials}
                  </div>
                  <div>
                    <span className="font-bold text-pf-ink block">{post.author.name}</span>
                    <span className="text-[10px] text-pf-ink/50">{post.publishedAt}</span>
                  </div>
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="font-bold text-pf-violet flex items-center gap-1 hover:underline"
                >
                  <span>Read Dispatches</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<SectionSkeleton height="h-[500px]" title="Loading blog posts..." />}>
      <BlogListContent />
    </Suspense>
  );
}

