import React from "react";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/home/HeroSection";
import { SectionSkeleton } from "@/components/ui/skeleton";
import { getCachedProducts } from "@/lib/catalogue";
import { ProductCardData } from "@/components/product/ProductCard";
import { getPublishedCms } from "@/server/cms/cms-service";

export async function generateMetadata() {
  const cms = await getPublishedCms();
  const homeSeo = cms.seo.find((s) => s.path === "/");
  return {
    title: homeSeo?.title || "Purple Friday | Custom Merchandise & Corporate Gifting",
    description: homeSeo?.description || "Industrial print shop for Indian startups and enterprises.",
  };
}

  // 2. Trust Strip (Lazy loaded)
  const TrustStrip = dynamic(
    () => import("@/components/home/TrustStrip").then((m) => m.TrustStrip),
    { loading: () => <SectionSkeleton height="h-28" title="Loading Verification Strip..." /> }
  );

// 3. Best Sellers Carousel (Lazy loaded)
        const BestSellersCarousel = dynamic(
  () => import("@/components/home/BestSellersCarousel").then((m) => m.BestSellersCarousel),
        {loading: () => <SectionSkeleton height="h-[520px]" title="Loading Curated Best Sellers..." /> }
        );

// 4. Category Bento Grid (Lazy loaded)
        const CategoryBentoGrid = dynamic(
  () => import("@/components/home/CategoryBentoGrid").then((m) => m.CategoryBentoGrid),
        {loading: () => <SectionSkeleton height="h-[600px]" title="Loading Product Bento..." /> }
        );

// 5. How It Works (Lazy loaded)
            const HowItWorksSequence = dynamic(
  () => import("@/components/home/HowItWorksSequence").then((m) => m.HowItWorksSequence),
            {loading: () => <SectionSkeleton height="h-[500px]" title="Loading Production Workflow..." /> }
            );

// 6. Customer Review Marquee (Lazy loaded)
            const CustomerReviewMarquee = dynamic(
  () => import("@/components/home/CustomerReviewMarquee").then((m) => m.CustomerReviewMarquee),
            {loading: () => <SectionSkeleton height="h-[400px]" title="Loading Customer Proof Wall..." /> }
            );

// 7. Order Process Timeline (Lazy loaded)
            const OrderProcessTimeline = dynamic(
  () => import("@/components/home/OrderProcessTimeline").then((m) => m.OrderProcessTimeline),
            {loading: () => <SectionSkeleton height="h-96" title="Loading Order Timeline..." /> }
            );

// 8. Stories Carousel (Lazy loaded)
            const StoriesCarousel = dynamic(
  () => import("@/components/home/StoriesCarousel").then((m) => m.StoriesCarousel),
            {loading: () => <SectionSkeleton height="h-[450px]" title="Loading Atelier Stories..." /> }
            );

// 9. Factory & Team (Lazy loaded)
          const FactoryTeamSection = dynamic(
  () => import("@/components/home/FactoryTeamSection").then((m) => m.FactoryTeamSection),
          {loading: () => <SectionSkeleton height="h-[480px]" title="Loading Factory Overview..." /> }
          );

// 10. FAQ (Lazy loaded)
              const FaqSection = dynamic(
  () => import("@/components/home/FaqSection").then((m) => m.FaqSection),
              {loading: () => <SectionSkeleton height="h-[500px]" title="Loading Frequently Asked Questions..." /> }
              );

// 11. Closing CTA Band (Lazy loaded)
              const ClosingCtaBand = dynamic(
  () => import("@/components/home/ClosingCtaBand").then((m) => m.ClosingCtaBand),
              {loading: () => <SectionSkeleton height="h-80" title="Loading Dispatch Call..." /> }
              );

export default async function HomePage(props: {
  searchParams?: Promise<{ previewToken?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const [rawProducts, cms] = await Promise.all([
    getCachedProducts(),
    getPublishedCms(searchParams.previewToken),
  ]);

  const products: ProductCardData[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortName: p.shortName,
    description: p.description,
    basePrice: p.basePrice,
    mrp: p.mrp,
    minQty: p.minQty,
    qtyStep: p.qtyStep,
    rating: 4.9,
    reviewCount: 42,
    badges: p.badges || ["Best Seller"],
    template: p.slug,
    color: "#FFFFFF",
  }));

  const isVisible = (id: string) => {
    const s = cms.sections.find((sec) => sec.id === id);
    return s ? s.visible : true;
  };

  return (
    <div className="flex flex-col w-full bg-paper">
      {/* 1. Hero Section (Above the fold, instant render) */}
      {isVisible("hero") && <HeroSection cmsHero={cms.hero} />}

      {/* 2. Trust Strip */}
      {isVisible("trust") && <TrustStrip />}

      {/* 3. Best Sellers Carousel */}
      {isVisible("best_sellers") && (
        <div className="py-16 md:py-20 border-b-2 border-ink bg-paper">
          <BestSellersCarousel products={products} />
        </div>
      )}

      {/* 4. Category Bento Grid */}
      {isVisible("categories") && (
        <div className="py-16 md:py-20 border-b-2 border-ink bg-white">
          <CategoryBentoGrid />
        </div>
      )}

      {/* 5. How It Works (Desktop Pinned Scroll / Mobile Stacked) */}
      {isVisible("how_it_works") && <HowItWorksSequence />}

      {/* 6. Customer Review Wall Marquee */}
      {isVisible("reviews") && (
        <div className="py-16 md:py-20 border-b-2 border-ink bg-white">
          <CustomerReviewMarquee />
        </div>
      )}

      {/* 7. Order Process Timeline (SVG Drawing Line) */}
      {isVisible("process") && <OrderProcessTimeline />}

      {/* 8. Stories / Press Log Carousel */}
      {isVisible("stories") && <StoriesCarousel />}

      {/* 9. Factory Floor & Team Section */}
      {isVisible("factory") && <FactoryTeamSection />}

      {/* 10. Frequently Asked Questions */}
      {isVisible("faq") && <FaqSection cmsFaqs={cms.faqs} />}

      {/* 11. Closing CTA Band */}
      {isVisible("cta") && <ClosingCtaBand />}
    </div>
  );
}
