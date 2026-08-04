import Stripe from "stripe";
import { getStripeEnvironment, requireServerEnv } from "@/lib/env";

let stripeClient: Stripe | undefined;

export function getStripe() {
  getStripeEnvironment();
  if (!stripeClient) {
    const { STRIPE_SECRET_KEY } = requireServerEnv("STRIPE_SECRET_KEY");
    stripeClient = new Stripe(STRIPE_SECRET_KEY, { appInfo: { name: "ReponseAstrale" } });
  }
  return stripeClient;
}
