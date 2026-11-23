import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ChevronRight, ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { getPublishedCms, verifyCmsPreviewToken } from "@/server/cms/cms-service";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ previewToken?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { previewToken } = await searchParams;
  const cms = await getPublishedCms(previewToken);
  const page = cms.customPages?.find((p) => p.slug === slug);

  if (!page) {
    return { title: "Page Not Found | Purple Friday" };
  }

  return {
    title: page.seoTitle || `${page.title} | Purple Friday Atelier`,
    description: page.seoDescription || `Information about ${page.title} from Purple Friday.`,
    openGraph: {
      title: page.seoTitle || page.title,
      description: page.seoDescription || `Information about ${page.title} from Purple Friday.`,
    },
  };
}

export default async function PublicCustomPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { previewToken } = await searchParams;
  const cms = await getPublishedCms(previewToken);
  const page = cms.customPages?.find((p) => p.slug === slug);

  const isPreview = Boolean(previewToken && verifyCmsPreviewToken(previewToken));

  if (!page) {
    notFound();
  }

  if (!page.published && !isPreview) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {isPreview && (
        <div className="bg-amber-500 text-pf-ink font-mono text-xs font-bold px-4 py-2 text-center sticky top-0 z-50 shadow-md">
          Draft Preview Mode: Viewing unpublished version of this page
        </div>
      )}

      {/* Header */}
      <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-mono text-pf-ink/60">
            <Link href="/" className="hover:text-pf-violet transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-pf-ink font-medium">{page.title}</span>
          </nav>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-pf-ink">
            {page.title}
          </h1>

          <div className="flex items-center gap-4 text-xs font-mono text-pf-ink/60 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-pf-violet" />
              Updated {new Date(page.updatedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-spot-lime font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Official Atelier Page
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
        <div className="border-2 border-pf-ink bg-white p-6 sm:p-10 shadow-[6px_6px_0_0_#15101F] font-sans text-sm text-pf-ink/80 leading-relaxed prose prose-base max-w-none">
          <ReactMarkdown>{page.contentMarkdown}</ReactMarkdown>
        </div>

        <div className="pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs font-bold text-pf-violet hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Purple Friday Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
