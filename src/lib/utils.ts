import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount in Indian Rupees (INR) using Indian numbering system
 * Example: 150000 -> ₹1,50,000
 */
export function formatINR(amount: number, options?: { showDecimals?: boolean }): string {
  const showDecimals = options?.showDecimals ?? amount % 1 !== 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Compute the discount percentage between MRP and unit price
 */
export function calculateDiscountPercent(mrp: number, currentPrice: number): number {
  if (mrp <= currentPrice || mrp <= 0) return 0;
  return Math.round(((mrp - currentPrice) / mrp) * 100);
}

