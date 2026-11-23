import prisma from "./prisma";
import { findProductBySlug } from "./catalogue";
import { IN_MEMORY_PRODUCTS } from "@/server/products/product-service";
import { roundHalfUp } from "@/server/pricing/engine";

import {
  CartItemInput,
  CalculatedItem,
  PricingCalculationResult,
  CATALOG_FALLBACK,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  STANDARD_GST_RATE,
  normalizeQuantity,
  resolveTierPrice,
  evaluateCoupon,
} from "./pricing-client";

export * from "./pricing-client";

/**
 * Calculate the authoritative cart total on the server using unified pure pricing engine.
 */
export async function calculateCartPricing(
  items: CartItemInput[],
  couponCode?: string
): Promise<PricingCalculationResult> {
  const calculatedItems: CalculatedItem[] = [];

  for (const item of items) {
    let productData: {
      name: string;
      slug: string;
      mrp: number;
      basePrice: number;
      minQty: number;
      qtyStep: number;
      template: string;
      tiers: Array<{ minQty: number; maxQty: number | null; unitPrice: number }>;
    } | null = null;

    // Try finding product in Database if live DATABASE_URL exists
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("sample-project") &&
      !process.env.DATABASE_URL.includes("user:password")
    ) {
      try {
        const dbProduct = await prisma.product.findFirst({
          where: {
            OR: [{ id: item.productId }, { slug: item.productId }],
          },
          include: {
            priceTiers: true,
            options: true,
          },
        });

        if (dbProduct) {
          productData = {
            name: dbProduct.name,
            slug: dbProduct.slug,
            mrp: dbProduct.mrp,
            basePrice: dbProduct.basePrice,
            minQty: dbProduct.minQty,
            qtyStep: dbProduct.qtyStep,
            template: dbProduct.slug.split("-")[0] || "tee",
            tiers: dbProduct.priceTiers.map((t) => ({
              minQty: t.minQty,
              maxQty: t.maxQty,
              unitPrice: t.unitPrice,
            })),
          };
        }
      } catch {
        // Fallback to in-memory catalogue
      }
    }

    // If not found in DB, check in-memory catalog
    if (!productData) {
      const catProd = findProductBySlug(item.productId);
      if (catProd) {
        productData = {
          name: catProd.name,
          slug: catProd.slug,
          mrp: catProd.mrp,
          basePrice: catProd.basePrice,
          minQty: catProd.minQty,
          qtyStep: catProd.qtyStep,
          template: catProd.template,
          tiers: catProd.priceTiers,
        };
      } else {
        productData =
          CATALOG_FALLBACK[item.productId] ??
          Object.values(CATALOG_FALLBACK)[0];
      }
    }

    // 1. Normalize quantity using engine
    const normalizedQty = normalizeQuantity(
      item.qty,
      productData.minQty,
      productData.qtyStep
    );

    // 2. Resolve Tier Unit Price using engine
    const tierUnitPrice = resolveTierPrice(
      normalizedQty,
      productData.basePrice,
      productData.tiers
    );

    // 3. Option price deltas
    let optionDelta = 0;
    if (item.options) {
      for (const val of Object.values(item.options)) {
        if (typeof val === "string") {
          if (val.includes("2XL") || val.includes("XXL")) optionDelta += 30;
          if (val.includes("XL")) optionDelta += 15;
          if (val.toLowerCase().includes("velvet") || val.toLowerCase().includes("gold")) optionDelta += 10;
        }
      }
    }

    const effectiveUnitPrice = tierUnitPrice + optionDelta;
    const lineTotal = effectiveUnitPrice * normalizedQty;

    const inMem = IN_MEMORY_PRODUCTS.get(item.productId) || IN_MEMORY_PRODUCTS.get(productData.slug);
    let isAvailable = true;
    let unavailabilityReason: string | undefined = undefined;
    if (inMem) {
      if (inMem.archived || inMem.status !== "ACTIVE" || inMem.active === false) {
        isAvailable = false;
        unavailabilityReason = "No longer available";
      } else if (inMem.stock !== null && inMem.stock <= 0) {
        isAvailable = false;
        unavailabilityReason = "Out of stock";
      }
    }

    calculatedItems.push({
      productId: item.productId,
      optionKey: item.optionKey,
      productName: productData.name,
      productSlug: productData.slug,
      qty: normalizedQty,
      unitPrice: effectiveUnitPrice,
      basePrice: productData.basePrice,
      mrp: productData.mrp,
      optionDelta,
      lineTotal,
      options: item.options,
      designId: item.designId,
      template: productData.template,
      isAvailable,
      unavailabilityReason,
    });
  }

  // 4. Subtotal
  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.lineTotal, 0);

  // 5. Coupon Discount Verification via engine rule
  let discount = 0;
  let discountBreakdown:
    | { code: string; amount: number; description: string }
    | undefined = undefined;

  if (couponCode) {
      const couponEval = evaluateCoupon(subtotal, couponCode);
      if (couponEval.eligible) {
        discount = couponEval.discount;
        discountBreakdown = couponEval.breakdown;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);

    // 6. GST Calculation
    const gst = roundHalfUp(discountedSubtotal * STANDARD_GST_RATE);

    // 7. Shipping Calculation
    const isFreeShipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shipping = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const amountNeededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - discountedSubtotal
    );

    // 8. Grand Total
    const total = discountedSubtotal + gst + shipping;

    return {
      items: calculatedItems,
      subtotal,
      discount,
      discountBreakdown,
      gst,
      shipping,
      total,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeShipping,
      hasUnavailableItems: calculatedItems.some((i) => i.isAvailable === false),
    };
  }
