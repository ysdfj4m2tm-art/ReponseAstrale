import { isLegalReadyForLivePayments } from "@/content/legal";

export class ConfigurationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Configuration serveur incomplète : ${missing.join(", ")}`);
    this.name = "ConfigurationError";
  }
}

export function requireServerEnv(...names: string[]) {
  const missing = names.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new ConfigurationError(missing);
  return Object.fromEntries(names.map((name) => [name, process.env[name]!.trim()])) as Record<string, string>;
}

export function getAppUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://reponseastrale.fr").replace(/\/$/, "");
}

export function getStripeEnvironment() {
  const value = process.env.STRIPE_ENVIRONMENT || "test";
  if (value !== "test" && value !== "live") throw new ConfigurationError(["STRIPE_ENVIRONMENT(test|live)"]);
  if (value === "live" && !isLegalReadyForLivePayments()) {
    throw new Error("Le paiement réel est bloqué tant que la configuration juridique obligatoire est incomplète.");
  }
  if (value === "live" && !hasAuthConfiguration()) {
    throw new Error("Le paiement réel est bloqué tant que WorkOS AuthKit n’est pas entièrement configuré.");
  }
  const secret = process.env.STRIPE_SECRET_KEY || "";
  if (value === "test" && secret.startsWith("sk_live_")) {
    throw new Error("Une clé Stripe live ne peut pas être utilisée dans l’environnement de test.");
  }
  return value;
}

export function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("fr-FR");
}

export function hasDatabaseConfiguration() {
  return Boolean(process.env.DATABASE_URL);
}

export function hasAuthConfiguration() {
  return Boolean(
    process.env.WORKOS_CLIENT_ID
    && process.env.WORKOS_API_KEY
    && process.env.WORKOS_COOKIE_PASSWORD
    && process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  );
}
