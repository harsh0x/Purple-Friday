import React from "react";
import { ProductCardSkeleton } from "@/components/feedback/skeleton";
import { RegistrationMark } from "@/components/ui/decorative";

export default function RootLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-in fade-in-0 duration-300">
      {/* Editorial Loading Header */}
      <div className="flex items-center gap-3 text-violet border-b border-ink/20 pb-4">
        <RegistrationMark size={20} variant="violet" className="animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest font-bold">
          Calibrating Press Plates & Retrieving Catalogue...
        </span>
      </div>

      {/* Grid of Skeleton Product Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  );
}

