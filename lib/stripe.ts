import Stripe from "stripe";
import type { CommerceProduct } from "@/content/commerce";
import { assertCommerceEnvironment, getStripeEnvironment, requireServerEnv } from "@/lib/env";
import { EnvironmentValidationError } from "@/lib/env-rules";

let stripeClient: Stripe | undefined;

export function getStripe() {
  assertCommerceEnvironment();
  getStripeEnvironment();
  if (!stripeClient) {
    const { STRIPE_SECRET_KEY } = requireServerEnv("STRIPE_SECRET_KEY");
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { appInfo: { name: "ReponseAstrale" } });
  }
  return stripeClient;
}

export function assertStripeLivemode(livemode: boolean) {
  const expectedLive = getStripeEnvironment() === "live";
  if (livemode !== expectedLive) throw new Error("STRIPE_MODE_MISMATCH");
}

export async function getVerifiedStripePrice(product: CommerceProduct) {
  const priceId = requireServerEnv(product.stripePriceEnv)[product.stripePriceEnv];
  const price = await getStripe().prices.retrieve(priceId);
  assertStripeLivemode(price.livemode);
  if (!price.active || price.type !== "one_time" || price.unit_amount !== product.priceCents || price.currency !== product.currency) {
    throw new EnvironmentValidationError(["STRIPE_PRICE_CONFIGURATION_MISMATCH"]);
  }
  return price.id;
}
