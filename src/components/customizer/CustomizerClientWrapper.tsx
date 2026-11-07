"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CatalogueProduct } from "@/lib/catalogue";
import { CustomizerSkeleton } from "./CustomizerSkeleton";

const CustomizerStudio = dynamic(
  () =>
    import("./CustomizerStudio").then((mod) => mod.CustomizerStudio),
  {
    ssr: false,
    loading: () => <CustomizerSkeleton />,
  }
);

export function CustomizerClientWrapper({ product }: { product: CatalogueProduct }) {
  return <CustomizerStudio product={product} />;
}
