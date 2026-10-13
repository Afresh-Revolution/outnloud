export type DiscountTier = {
  minimumQuantity: number;
  discountPercent: number;
};

export function linePrice(unitPrice: number, quantity: number, tiers: DiscountTier[]) {
  const originalAmount = Math.max(0, unitPrice) * Math.max(0, quantity);
  const sorted = [...tiers].sort((a, b) => a.minimumQuantity - b.minimumQuantity);
  let applied: DiscountTier | null = null;
  for (const tier of sorted) {
    if (quantity < tier.minimumQuantity) break;
    applied = tier;
  }
  const discountAmount = applied
    ? Math.round((originalAmount * applied.discountPercent) / 100)
    : 0;
  return {
    originalAmount,
    discountAmount,
    finalAmount: Math.max(0, originalAmount - discountAmount),
    applied,
  };
}
