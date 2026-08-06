import { describe, expect, it } from "vitest";
import { validatePreviewEnvironment, validateProductionEnvironment } from "@/lib/env-rules";

const production = {
  APP_URL: "https://reponseastrale.fr",
  DATABASE_URL: "postgresql://ep-curly-brook-a2smc636-pooler.eu-central-1.aws.neon.tech/app",
  DATABASE_URL_UNPOOLED: "postgresql://ep-curly-brook-a2smc636.eu-central-1.aws.neon.tech/app",
  NEON_BRANCH: "production",
  STRIPE_SECRET_KEY: "sk_live_placeholder_but_structurally_live",
  STRIPE_WEBHOOK_SECRET: "whsec_placeholder_but_structurally_valid",
  STRIPE_PRICE_ONE_SUN: "price_liveOne",
  STRIPE_PRICE_THREE_SUNS: "price_liveThree",
  STRIPE_ENVIRONMENT: "live",
  STRIPE_AUTOMATIC_TAX: "false",
  WORKOS_CLIENT_ID: "client_production",
  WORKOS_API_KEY: "sk_production_placeholder",
  WORKOS_COOKIE_PASSWORD: "a-production-cookie-password-over-32-chars",
  WORKOS_ENVIRONMENT: "production",
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: "https://reponseastrale.fr/callback",
};

describe("séparation des environnements", () => {
  it("accepte une forme Production complète", () => {
    expect(validateProductionEnvironment(production)).toEqual([]);
  });

  it("refuse les ressources test et la branche preview en Production", () => {
    const issues = validateProductionEnvironment({
      ...production,
      NEON_BRANCH: "codex-sales-funnel",
      STRIPE_SECRET_KEY: "sk_test_forbidden",
      STRIPE_ENVIRONMENT: "test",
      WORKOS_ENVIRONMENT: "staging",
    });
    expect(issues.join("\n")).toMatch(/NEON_BRANCH/);
    expect(issues.join("\n")).toMatch(/clé live/);
    expect(issues.join("\n")).toMatch(/STRIPE_ENVIRONMENT/);
    expect(issues.join("\n")).toMatch(/WORKOS_ENVIRONMENT/);
  });

  it("refuse les ressources Production en Deploy Preview", () => {
    const issues = validatePreviewEnvironment({
      ...production,
      APP_URL: "https://deploy-preview-3--reponseastrale.netlify.app",
      NEXT_PUBLIC_WORKOS_REDIRECT_URI: "https://deploy-preview-3--reponseastrale.netlify.app/callback",
      DATABASE_URL: "postgresql://ep-small-feather-a2x8uj2j-pooler.eu-central-1.aws.neon.tech/app",
      DATABASE_URL_UNPOOLED: "postgresql://ep-small-feather-a2x8uj2j.eu-central-1.aws.neon.tech/app",
    });
    expect(issues.join("\n")).toMatch(/clé test/);
    expect(issues.join("\n")).toMatch(/Production est interdite/);
  });
});
