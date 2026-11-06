"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ProductMockup } from "../mockup/ProductMockup";

export interface SmartImageProps extends Omit<ImageProps, "onError"> {
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  fallbackTemplate?: string;
  wrapperClassName?: string;
}

export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  aspectRatio = "square",
  fallbackTemplate,
  priority = false,
  ...props
}: SmartImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aspectStyles = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[16/9]",
  }[aspectRatio];

  if (hasError && fallbackTemplate) {
    return (
      <div
        className={cn(
          "w-full overflow-hidden bg-paper rounded-xs flex items-center justify-center p-4 border border-ink/10",
          aspectStyles,
          wrapperClassName
        )}
      >
        <ProductMockup template={fallbackTemplate} className="max-h-full max-w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-ink/5 rounded-xs select-none",
        aspectStyles,
        wrapperClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={cn(
          "object-contain transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        {...props}
      />
    </div>
  );
}

