import React from "react";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { getPublishedCms } from "@/server/cms/cms-service";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getPublishedCms();
  const page = cms.corePages?.find((p) => p.slug === "terms");
  return {
    title: page?.seoTitle || "Terms & Conditions | Purple Friday",
    description:
      page?.seoDescription ||
      "Terms of service, B2B purchase orders, intellectual property, and production tolerances for Purple Friday India.",
  };
}

  export default async function TermsPage(props: {
    searchParams?: Promise<{ previewToken?: string }>;
  }) {
    const searchParams = props.searchParams ? await props.searchParams : {};
    const cms = await getPublishedCms(searchParams.previewToken);
    const page = cms.corePages?.find((p) => p.slug === "terms");

    return (
      <div className="min-h-screen bg-pf-paper pb-24">
        <div className="border-b-2 border-pf-ink bg-white py-12 px-4 md:px-8">
          <div className="mx-auto max-w-4xl">
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Commercial Agreement
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-pf-ink mt-1">
              {page?.title || "Terms of Service"}
            </h1>
            <p className="font-mono text-xs text-pf-ink/60 mt-2">
              Governed by the Laws of the Republic of India • Bengaluru Jurisdiction
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 md:px-8 pt-10">
            <div className="border-2 border-pf-ink bg-white p-6 sm:p-10 shadow-[6px_6px_0_0_#15101F] space-y-8 font-sans text-sm text-pf-ink/80 leading-relaxed prose prose-base max-w-none">
              {page?.contentMarkdown ? (
                <ReactMarkdown>{page.contentMarkdown}</ReactMarkdown>
              ) : (
                <>
                  <section className="space-y-3">
                    <h2 className="font-display text-xl font-bold text-pf-ink">
                      1. General Commercial Scope
                    </h2>
                    <p>
                      These Terms of Service govern all custom printing, apparel manufacturing, and merchandise fabrication orders placed with Purple Friday (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) through our website, sales representatives, or corporate purchase orders (POs).
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-display text-xl font-bold text-pf-ink">
                      2. Intellectual Property & Artwork Authorization
                    </h2>
                    <p>
                      By uploading a logo, trademark, slogan, or vector design, you warrant and represent that you are the rightful copyright/trademark holder or possess explicit authorization from the owner to reproduce the mark for custom merchandise. You agree to indemnify and hold Purple Friday harmless from any third-party claims arising from alleged trademark or copyright infringement.
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-display text-xl font-bold text-pf-ink">
                      3. Production Tolerances
                    </h2>
                    <p>
                      Custom manufacturing involves natural textile fibers and thermal bonding. The following commercial tolerances apply across all production runs:
                    </p>
                    <ul className="list-disc pl-5 font-mono text-xs space-y-1.5">
                      <li><strong>Dimensional Print Placement:</strong> ±1.0mm tolerance on apparel center/chest alignment and badge die-cutting.</li>
                      <li><strong>Textile GSM Variance:</strong> ±5% industry-standard variance in knit batch weight due to seasonal humidity.</li>
                      <li><strong>Color Profiles:</strong> Calibrated to ISO 12647-2 proofing standard. Visual differences on uncalibrated consumer screens do not constitute defects.</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h2 className="font-display text-xl font-bold text-pf-ink">
                      4. Corporate Purchase Orders & Invoicing
                    </h2>
                    <p>
                      All orders are billed in Indian Rupees (INR) with 18% Goods and Services Tax (GST) applied under SAC Code 998912. Official GST tax invoices with input credit eligibility are furnished for all registered entities providing a valid 15-character GSTIN.
                    </p>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
        );
}

