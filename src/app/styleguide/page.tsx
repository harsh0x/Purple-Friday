"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SectionHeading } from "@/components/ui/section-heading";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import {
  RegistrationMark,
  CropCorners,
  HalftoneBackground,
} from "@/components/ui/decorative";
import { toast } from "sonner";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Printer,
  Layers,
  Palette,
} from "lucide-react";

export default function StyleguidePage() {
  const [chipSelected, setChipSelected] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-paper text-ink p-6 md:p-12 relative overflow-hidden">
        <Toaster />

        {/* Decorative corner registration marks */}
        <div className="fixed top-4 left-4 pointer-events-none opacity-40">
          <RegistrationMark size={28} variant="ink" />
        </div>
        <div className="fixed top-4 right-4 pointer-events-none opacity-40">
          <RegistrationMark size={28} variant="ink" />
        </div>

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          {/* Header */}
          <div className="border-b-2 border-ink pb-8">
            <div className="flex items-center gap-3 text-violet mb-2">
              <RegistrationMark size={18} variant="violet" />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                Editorial Print-Shop Design System
              </span>
            </div>
            <h1 className="heading-hero font-extrabold text-ink tracking-tight">
              Purple Friday Styleguide
            </h1>
            <p className="mt-4 text-base md:text-lg text-ink/70 font-sans max-w-3xl">
              Production design tokens, interactive components, registration crop
              corners, fluid typography scale, and the 6 distinct button roles.
            </p>
          </div>

          {/* 1. Color Palette Tokens */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Color Tokens"
              title="Print Spot Palette & Ink Tints"
              description="Crafted around artisan offset-press inks: Carbon Ink, Cotton Paper, Electric Violet, Risograph Lilac, and high-visibility Spot Lime."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="border border-ink p-4 bg-ink text-paper rounded-sm shadow-stamp-sm">
                <div className="h-14 rounded-xs mb-2 border border-paper/20 bg-ink" />
                <p className="font-display font-bold text-sm">Carbon Ink</p>
                <p className="font-mono text-xs opacity-70">#15101F</p>
              </div>

              <div className="border border-ink p-4 bg-paper-pure text-ink rounded-sm shadow-stamp-sm">
                <div className="h-14 rounded-xs mb-2 border border-ink/20 bg-paper" />
                <p className="font-display font-bold text-sm">Cotton Paper</p>
                <p className="font-mono text-xs text-ink/70">#F5F0E8</p>
              </div>

              <div className="border border-ink p-4 bg-violet text-white rounded-sm shadow-stamp-sm">
                <div className="h-14 rounded-xs mb-2 border border-white/20 bg-violet" />
                <p className="font-display font-bold text-sm">Electric Violet</p>
                <p className="font-mono text-xs text-white/70">#6A2CFF</p>
              </div>

              <div className="border border-ink p-4 bg-lilac text-ink rounded-sm shadow-stamp-sm">
                <div className="h-14 rounded-xs mb-2 border border-ink/20 bg-lilac" />
                <p className="font-display font-bold text-sm">Risograph Lilac</p>
                <p className="font-mono text-xs text-ink/70">#CDB8FF</p>
              </div>

              <div className="border border-ink p-4 bg-spot-lime text-ink rounded-sm shadow-stamp-sm">
                <div className="h-14 rounded-xs mb-2 border border-ink/30 bg-spot-lime" />
                <p className="font-display font-bold text-sm">Spot-Lime</p>
                <p className="font-mono text-xs text-ink/80">#D8FF3F (Max 1/view)</p>
              </div>
            </div>
          </section>

          {/* 2. Button Taxonomy: All 6 Distinct Roles */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Button Taxonomy"
              title="Six Purpose-Built Button Roles"
              description="Each interactive role has a distinct physical behavior. No repetitive rounded boxes."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Stamp */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  1. Primary Stamp
                </span>
                <p className="text-xs text-ink/70">
                  Solid violet, hard 4px offset ink shadow that physically presses down on click.
                </p>
                <div className="pt-2">
                  <Button variant="stamp" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                    Order 50 Pcs — ₹9,250
                  </Button>
                </div>
              </div>

              {/* 2. Secondary Link Sweep */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  2. Secondary Text Link
                </span>
                <p className="text-xs text-ink/70">
                  Text link with an animated horizontal underline sweep on hover.
                </p>
                <div className="pt-2">
                  <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    View All 24 Products
                  </Button>
                </div>
              </div>

              {/* 3. Magnetic Icon Button */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  3. Magnetic Icon Button
                </span>
                <p className="text-xs text-ink/70">
                  Circular container with subtle magnetic desktop pull.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Button variant="magnetic" size="icon" aria-label="Print proof">
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button variant="magnetic" size="icon" aria-label="Color palette">
                    <Palette className="h-5 w-5" />
                  </Button>
                  <Button variant="magnetic" size="icon" aria-label="Layers">
                    <Layers className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* 4. Design CTA */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  4. Design CTA Wipe
                </span>
                <p className="text-xs text-ink/70">
                  Ink background with violet fill wipe animating from left on hover.
                </p>
                <div className="pt-2">
                  <Button variant="design-cta" leftIcon={<Sparkles className="h-4 w-4" />}>
                    Customize in Studio
                  </Button>
                </div>
              </div>

              {/* 5. Quantity Nudge */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  5. Quantity Nudge Chip
                </span>
                <p className="text-xs text-ink/70">
                  Spot-lime pill with rolling counter discount savings animation.
                </p>
                <div className="pt-2">
                  <Button variant="nudge">
                    Make it 100 for ₹145/pc (Save ₹4,000)
                  </Button>
                </div>
              </div>

              {/* 6. Ghost Filter */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm relative">
                <CropCorners offset={4} length={8} />
                <span className="font-mono text-xs uppercase font-bold text-violet block">
                  6. Ghost Filter
                </span>
                <p className="text-xs text-ink/70">
                  Clean 1px ink outline with 44px min touch target for facets.
                </p>
                <div className="pt-2">
                  <Button variant="ghost">Filter by 100% Cotton</Button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Form Controls & Interactive Primitives */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Form Primitives"
              title="Inputs, Dropdowns & Interactive Toggles"
              description="Accessible 44px touch targets with crisp print-shop ink borders and mono labels."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border border-ink bg-paper-pure rounded-sm">
              <Input
                label="Company Name"
                placeholder="e.g. Zerodha Technologies"
                helperText="Required for GST tax invoice generation"
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-mono uppercase tracking-wider text-ink/80 font-semibold">
                  Print Method
                </label>
                <Select defaultValue="dtg">
                  <SelectTrigger>
                    <SelectValue placeholder="Select print method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dtg">Direct-to-Garment (DTG)</SelectItem>
                    <SelectItem value="screen">Spot Screen Print (Pantone)</SelectItem>
                    <SelectItem value="embroidery">High-Density Embroidery</SelectItem>
                    <SelectItem value="laser">Precision Laser Engraving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-6">
                <Checkbox
                  label="Include GST Invoice (18% Input Credit)"
                  defaultChecked
                />
                <Checkbox label="Send digital press proof before production" />
              </div>
            </div>
          </section>

          {/* 4. Badges, Chips & Price Formatter */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Badges & Prices"
              title="Rupee Formatting & Print Proof Indicators"
              description="Tabular DM Mono currency formatting with tier pricing discounts and verification badges."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Badges & Chips */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm">
                <h3 className="font-mono text-xs uppercase font-bold text-ink/80">
                  Status Badges & Category Chips
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="lime" dot>Best Seller</Badge>
                  <Badge variant="lilac">Offset Proof Ready</Badge>
                  <Badge variant="ink">Min 10 Pcs</Badge>
                  <Badge variant="violet">100% Bio-Washed</Badge>
                  <Badge variant="outline">Pan-India Courier</Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {["all", "apparel", "badges", "corporate"].map((category) => (
                    <Chip
                      key={category}
                      selected={chipSelected === category}
                      onClick={() => setChipSelected(category)}
                      count={category === "all" ? 24 : 6}
                    >
                      {category.toUpperCase()}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Price & Rating */}
              <div className="p-6 border border-ink bg-paper-pure space-y-4 rounded-sm">
                <h3 className="font-mono text-xs uppercase font-bold text-ink/80">
                  Price Hierarchy & Star Ratings
                </h3>
                <div className="space-y-3">
                  <Price
                    amount={145}
                    mrp={299}
                    minQty={50}
                    tierPrefix="From"
                    size="hero"
                  />
                  <div className="flex items-center gap-4">
                    <Rating score={4.9} totalReviews={128} />
                    <span className="text-xs font-mono text-violet font-semibold">
                      Verified Corporate Orders
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Modals, Drawers & Overlays */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Overlays & Feedback"
              title="Dialogs, Responsive Drawer & Notifications"
              description="Desktop side-drawer, mobile bottom-sheet, tactile toasts, and accessible tooltips."
            />
            <div className="p-6 border border-ink bg-paper-pure rounded-sm flex flex-wrap gap-4 items-center">
              {/* Dialog Trigger */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="stamp">Open Proof Approval Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Print Proof #PF-2611</DialogTitle>
                    <DialogDescription>
                      Review the 300 DPI vector placement on your magnetic badge order before sending to press.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6 border border-ink/20 bg-paper rounded-xs text-center space-y-2 relative">
                    <HalftoneBackground variant="violet" />
                    <p className="font-mono text-sm font-bold text-ink relative z-10">
                      Print Area: 58mm × 58mm
                    </p>
                    <p className="text-xs text-ink/60 font-sans relative z-10">
                      Spot White Underbase + Gloss Lamination
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                      Request Changes
                    </Button>
                    <Button variant="stamp" onClick={() => setDialogOpen(false)}>
                      Approve & Print
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Drawer Trigger */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="design-cta">Open Quick Cart Drawer</Button>
                </DrawerTrigger>
                <DrawerContent side="responsive">
                  <DrawerHeader>
                    <div>
                      <DrawerTitle>Cart (3 Items)</DrawerTitle>
                      <DrawerDescription>
                        All bulk prices verified on server
                      </DrawerDescription>
                    </div>
                  </DrawerHeader>
                  <DrawerBody className="space-y-4">
                    <div className="p-4 border border-ink/20 bg-paper-pure rounded-xs flex justify-between items-center">
                      <div>
                        <p className="font-display font-bold text-sm">
                          Classic Polo (Black, L)
                        </p>
                        <p className="font-mono text-xs text-ink/70">
                          Qty: 25 × ₹320
                        </p>
                      </div>
                      <Price amount={8000} size="sm" showSaveBadge={false} />
                    </div>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button variant="stamp" className="w-full">
                      Proceed to Checkout — ₹8,000
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              {/* Tooltip Demo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost">Hover for Press Specs</Button>
                </TooltipTrigger>
                <TooltipContent>
                  Resolution: 300 DPI CMYK Vector PDF
                </TooltipContent>
              </Tooltip>

              {/* Toast Trigger */}
              <Button
                variant="nudge"
                onClick={() =>
                  toast.success("Coupon FIRSTORDER applied!", {
                    description: "Extra 12% discount subtracted on cart total.",
                  })
                }
              >
                Trigger Live Toast
              </Button>
            </div>
          </section>

          {/* 6. Tabs & Accordion */}
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Disclosure Patterns"
              title="Tabs & FAQ Accordions"
              description="Print-shop tabs and collapsible FAQ items for product specifications."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 border border-ink bg-paper-pure rounded-sm">
              {/* Tabs */}
              <div>
                <h3 className="font-mono text-xs uppercase font-bold text-ink/80 mb-3">
                  Production Specifications Tab
                </h3>
                <Tabs defaultValue="specs">
                  <TabsList>
                    <TabsTrigger value="specs">Garment Specs</TabsTrigger>
                    <TabsTrigger value="tiers">Tier Pricing</TabsTrigger>
                    <TabsTrigger value="shipping">Delivery</TabsTrigger>
                  </TabsList>
                  <TabsContent value="specs" className="text-sm font-sans text-ink/80 space-y-2">
                    <p>• 100% Super-Combed Cotton, 220 GSM heavyweight knit.</p>
                    <p>• Pre-shrunk with lycra ribbed neckband.</p>
                    <p>• Bio-washed for ultra-smooth screen printing surface.</p>
                  </TabsContent>
                  <TabsContent value="tiers" className="text-sm font-mono space-y-1">
                    <p>• 5 – 24 pcs: ₹380 / pc</p>
                    <p>• 25 – 99 pcs: ₹310 / pc (Save 18%)</p>
                    <p>• 100+ pcs: ₹245 / pc (Save 35%)</p>
                  </TabsContent>
                  <TabsContent value="shipping" className="text-sm font-sans text-ink/80 space-y-2">
                    <p>• Dispatched in 3-5 business days after digital proof sign-off.</p>
                    <p>• Express air courier across all India PIN codes.</p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Accordion */}
              <div>
                <h3 className="font-mono text-xs uppercase font-bold text-ink/80 mb-3">
                  Frequently Asked Questions
                </h3>
                <Accordion type="single" collapsible defaultValue="item-1">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Do you send a sample proof before bulk printing?</AccordionTrigger>
                    <AccordionContent>
                      Yes. Every custom order receives a digital 3D placement proof for your sign-off before we start screen or digital printing.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Can I provide a GSTIN for tax invoice input credit?</AccordionTrigger>
                    <AccordionContent>
                      Absolutely. Enter your 15-digit GSTIN at checkout and we issue a compliant B2B tax invoice with 18% GST input credit.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}

