"use client";

import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs transition-opacity duration-300",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "right" | "left" | "bottom" | "responsive";
}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = "responsive", ...props }, ref) => {
  // side="responsive": bottom sheet on mobile (<md), side flyout from right on desktop (>=md)
  let positionStyles = "";

  if (side === "responsive") {
    positionStyles =
      "inset-x-0 bottom-0 rounded-t-xl max-h-[90vh] md:inset-y-0 md:right-0 md:left-auto md:w-full md:max-w-md md:rounded-none md:max-h-full border-t md:border-t-0 md:border-l border-ink";
  } else if (side === "right") {
    positionStyles =
      "inset-y-0 right-0 h-full w-full max-w-md border-l border-ink";
  } else if (side === "left") {
    positionStyles =
      "inset-y-0 left-0 h-full w-full max-w-md border-r border-ink";
  } else {
    positionStyles =
      "inset-x-0 bottom-0 rounded-t-xl max-h-[85vh] border-t border-ink";
  }

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col bg-paper shadow-stamp-lg outline-none transition-transform duration-300 ease-editorial",
          // Responsive slide-in: up on mobile, left on desktop
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "responsive"
            ? "data-[state=closed]:slide-out-to-bottom md:data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-right"
            : "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          positionStyles,
          className
        )}
        {...props}
      >
        {/* Mobile drag handle bar */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink/20 md:hidden" />
        {children}
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = ({
  className,
  children,
  showClose = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showClose?: boolean }) => (
  <div
    className={cn(
      "flex items-center justify-between border-b border-ink/20 px-6 py-4 shrink-0",
      className
    )}
    {...props}
  >
    <div className="flex-1">{children}</div>
    {showClose && (
      <DrawerClose className="rounded-sm p-1.5 text-ink/70 opacity-70 transition-opacity hover:opacity-100 hover:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-violet ml-2">
        <X className="h-4 w-4" />
        <span className="sr-only">Close drawer</span>
      </DrawerClose>
    )}
  </div>
);
DrawerHeader.displayName = "DrawerHeader";

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-display font-bold text-ink tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs font-mono text-ink/70", className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
    {...props}
  />
);
DrawerBody.displayName = "DrawerBody";

export const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-t border-ink/20 px-6 py-4 bg-paper-pure/80 backdrop-blur-xs shrink-0",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";
