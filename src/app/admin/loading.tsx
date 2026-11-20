import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Greeting Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#15101F]/10">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-[#15101F]/10 rounded-2xl" />
          <div className="h-4 w-48 bg-[#15101F]/10 rounded-xl" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-28 bg-[#15101F]/10 rounded-2xl" />
          <div className="h-10 w-28 bg-[#15101F]/10 rounded-2xl" />
        </div>
      </div>

      {/* Top Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white/70 border border-[#15101F]/10 rounded-3xl p-6" />
        <div className="h-72 bg-white/70 border border-[#15101F]/10 rounded-3xl p-6" />
      </div>

      {/* KPI Tiles Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-white/70 border border-[#15101F]/10 rounded-3xl p-5"
          />
        ))}
      </div>
    </div>
  );
}
