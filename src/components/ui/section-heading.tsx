import React from "react";
import { cn } from "@/lib/utils";
import { RegistrationMark } from "./decorative";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 mb-8",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <div className="flex items-center gap-2 text-violet">
          <RegistrationMark size={14} variant="violet" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase">
            {eyebrow}
          </span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between w-full gap-4">
        <div>
          <h2 className="heading-section text-ink font-bold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm sm:text-base text-ink/70 font-sans max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

