export const productCodes = ["one_sun", "three_suns"] as const;
export type ProductCode = (typeof productCodes)[number];

export type CommerceProduct = {
  code: ProductCode;
  name: string;
  subtitle: string;
  priceCents: number;
  currency: "eur";
  sunCount: number;
  validityDays: number;
  badge?: string;
  stripePriceEnv: "STRIPE_PRICE_ONE_SUN" | "STRIPE_PRICE_THREE_SUNS";
};

export const commerceProducts: Record<ProductCode, CommerceProduct> = {
  one_sun: {
    code: "one_sun",
    name: "1 Soleil",
    subtitle: "Une question personnelle",
    priceCents: 1990,
    currency: "eur",
    sunCount: 1,
    validityDays: 7,
    stripePriceEnv: "STRIPE_PRICE_ONE_SUN",
  },
  three_suns: {
    code: "three_suns",
    name: "3 Soleils",
    subtitle: "Trois questions personnelles",
    priceCents: 4990,
    currency: "eur",
    sunCount: 3,
    validityDays: 30,
    badge: "Le plus avantageux",
    stripePriceEnv: "STRIPE_PRICE_THREE_SUNS",
  },
};

export const obsoleteStripePriceIds = new Set([
  "price_1U0k25FU5EK3BrL6q2iyFsmR",
  "price_1U0k2HFU5EK3BrL692pLcTvE",
]);

export function getCommerceProduct(code: string): CommerceProduct | null {
  return productCodes.includes(code as ProductCode) ? commerceProducts[code as ProductCode] : null;
}

export function formatEuro(priceCents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(priceCents / 100);
}

export function formatSunCount(count: number) {
  return `${count} ${count > 1 ? "Soleils" : "Soleil"}`;
}

export function calculateExpiration(paidAt: Date, validityDays: number) {
  return new Date(paidAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
}

export function isQuestionSubmittedBeforeExpiration(submittedAt: Date, expiresAt: Date) {
  return submittedAt.getTime() <= expiresAt.getTime();
}

export const sunRule = "1 Soleil permet de poser 1 question personnelle.";
