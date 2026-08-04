import { getCommerceProduct, obsoleteStripePriceIds, type CommerceProduct } from "@/content/commerce";

export type CheckoutInput = {
  productCode: string;
  email: string;
  chartToken?: string;
  acceptCgv: boolean;
  acceptExecution: boolean;
};

export function validateCheckoutInput(value: CheckoutInput) {
  const product = getCommerceProduct(value.productCode);
  if (!product) return { ok: false as const, code: "INVALID_PRODUCT" };
  if (!/^\S+@\S+\.\S+$/.test(value.email.trim())) return { ok: false as const, code: "INVALID_EMAIL" };
  if (!value.acceptCgv || !value.acceptExecution) return { ok: false as const, code: "CONSENT_REQUIRED" };
  return { ok: true as const, product };
}

export function validatePaidLine(
  product: CommerceProduct,
  line: { priceId: string | null; amountTotal: number | null; currency: string | null },
  configuredPriceId: string,
) {
  if (!line.priceId || obsoleteStripePriceIds.has(line.priceId)) return false;
  return line.priceId === configuredPriceId && line.amountTotal === product.priceCents && line.currency === product.currency;
}
