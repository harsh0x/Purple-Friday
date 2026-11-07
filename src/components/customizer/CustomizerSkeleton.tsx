import React from "react";

export function CustomizerSkeleton() {
  return (
    <div className="min-h-screen bg-pf-paper text-pf-ink pt-20 pb-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-pf-ink/10 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-pf-ink/10 rounded" />
            <div className="h-8 w-64 bg-pf-ink/15 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-24 bg-pf-ink/10 rounded" />
            <div className="h-10 w-36 bg-pf-violet/20 rounded" />
          </div>
        </div>

        {/* Studio Workspace Grid Skeleton */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Centered Canvas Skeleton (7 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-[580px] aspect-square rounded-2xl bg-white border border-pf-ink/10 shadow-sm relative flex items-center justify-center p-8">
              <div className="w-3/4 h-3/4 rounded-xl bg-pf-ink/5 flex items-center justify-center">
                <div className="w-1/2 h-1/2 border-2 border-dashed border-pf-violet/30 rounded" />
              </div>
            </div>
            {/* View & Undo/Redo pill strip */}
            <div className="mt-4 flex items-center gap-2">
              <div className="h-9 w-20 bg-pf-ink/10 rounded-full" />
              <div className="h-9 w-20 bg-pf-ink/10 rounded-full" />
              <div className="h-9 w-24 bg-pf-ink/10 rounded-full" />
            </div>
          </div>

          {/* Right Tool & Pricing Panel Skeleton (5 cols on lg) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
              <div className="h-5 w-28 bg-pf-ink/15 rounded" />
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-pf-ink/10" />
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
              <div className="h-5 w-36 bg-pf-ink/15 rounded" />
              <div className="h-28 rounded-xl bg-pf-ink/5 border border-dashed border-pf-ink/20" />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-pf-ink/10 shadow-sm space-y-4">
              <div className="h-5 w-32 bg-pf-ink/15 rounded" />
              <div className="h-12 bg-pf-ink/10 rounded" />
              <div className="h-12 bg-pf-violet/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

