/**
 * Order totals: subtotal + shipping + GST. Money in paise.
 *
 * - GST: each product uses its own rate if set, otherwise the store's default
 *   rate (Admin → Settings). It is added on top of the item price.
 * - Shipping: the store's flat fee covers every product without its own fee;
 *   a product with its own fee adds that fee per unit. The free-shipping
 *   threshold makes the whole shipping free.
 */
export type PricingSettings = { shippingFlatFee: number; freeShippingThreshold: number; gstRate: number };
export type PricedLine = { lineTotal: number; qty: number; gstRate?: number | null; shippingFee?: number | null };

export const gstRateFor = (line: Pick<PricedLine, "gstRate">, s: Pick<PricingSettings, "gstRate">) => line.gstRate ?? s.gstRate ?? 0;

export function computeTotals(lines: PricedLine[], s: PricingSettings) {
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const free = s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold;
  const usesStoreFee = lines.some((l) => l.shippingFee == null);
  const shippingFee = free || !lines.length ? 0 : (usesStoreFee ? s.shippingFlatFee : 0) + lines.reduce((n, l) => n + (l.shippingFee ?? 0) * l.qty, 0);
  const gstAmount = lines.reduce((n, l) => n + Math.round((l.lineTotal * gstRateFor(l, s)) / 100), 0);
  return { subtotal, shippingFee, gstAmount, total: subtotal + shippingFee + gstAmount };
}
