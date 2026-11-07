export interface PriceTierInput {
  minQty: number;
  maxQty: number | null;
  unitPrice: number;
}

export interface TierValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates quantity-wise price tiers:
 * - Must be contiguous (no gaps, no overlaps between tiers)
 * - Prices must strictly decrease as volume increases
 * - Quantities must be strictly positive integers
 * - Last tier must have maxQty === null
 */
export function validatePriceTiers(tiers: PriceTierInput[]): TierValidationResult {
  const errors: string[] = [];

  if (!tiers || tiers.length === 0) {
    return { valid: false, errors: ["Product must define at least one pricing tier."] };
  }

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];

    if (!Number.isInteger(tier.minQty) || tier.minQty <= 0) {
      errors.push(`Tier ${i + 1}: Minimum quantity must be a positive integer.`);
    }

    if (!Number.isFinite(tier.unitPrice) || tier.unitPrice <= 0) {
      errors.push(`Tier ${i + 1}: Unit price must be greater than zero.`);
    }

    if (i < tiers.length - 1) {
      // Intermediate tiers
      if (tier.maxQty === null || !Number.isInteger(tier.maxQty)) {
        errors.push(`Tier ${i + 1}: Intermediate tier must specify a valid maximum quantity.`);
      } else if (tier.maxQty < tier.minQty) {
        errors.push(`Tier ${i + 1}: Maximum quantity cannot be less than minimum quantity.`);
      }

      // Check contiguity with next tier
      const nextTier = tiers[i + 1];
      if (tier.maxQty !== null && nextTier.minQty !== tier.maxQty + 1) {
        errors.push(
          `Non-contiguous gap/overlap between Tier ${i + 1} (ends at ${tier.maxQty}) and Tier ${
            i + 2
          } (starts at ${nextTier.minQty}). Must start at ${tier.maxQty + 1}.`
        );
      }

      // Check strictly decreasing prices
      if (nextTier.unitPrice >= tier.unitPrice) {
        errors.push(
          `Pricing must strictly decrease with volume: Tier ${i + 2} (₹${
            nextTier.unitPrice
          }) cannot be >= Tier ${i + 1} (₹${tier.unitPrice}).`
        );
      }
    } else {
      // Final tier
      if (tier.maxQty !== null) {
        errors.push(`Final Tier ${i + 1}: The highest volume tier must be open-ended (maxQty = null).`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates role-based authorization for administrative access
 */
export function isUserAdmin(user: { role?: string } | null | undefined): boolean {
  if (!user || !user.role) return false;
  return user.role.toUpperCase() === "ADMIN";
}

