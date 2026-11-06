"use client";

import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    label?: string;
  }
>(({ className, label, id, ...props }, ref) => {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const checkboxNode = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-sm border border-ink/40 bg-paper-pure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-violet data-[state=checked]:text-white data-[state=checked]:border-violet",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) return checkboxNode;

  return (
    <div className="flex items-center space-x-2.5">
      {checkboxNode}
      <label
        htmlFor={checkboxId}
        className="text-sm font-sans text-ink cursor-pointer select-none leading-none"
      >
        {label}
      </label>
    </div>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

