import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import Stripe from "stripe";
import { isConsumerMediatorConfigured, isLegalReadyForLivePayments } from "../content/legal.ts";
import { productionEnvironment, validateProductionEnvironment } from "../lib/env-rules.ts";

const env = process.env;
const failures = [];
const warnings = [];
const report = (label, state) => console.log(`${label}: ${state}`);
const present = (name) => Boolean(env[name]?.trim());

console.log("Préflight Production — lecture seule, valeurs masquées");
const classified = new Set(["STRIPE_SECRET_KEY", "STRIPE_ENVIRONMENT", "WORKOS_ENVIRONMENT", "NEON_BRANCH"]);
for (const name of productionEnvironment.required) {
  if (!classified.has(name)) report(name, present(name) ? "présent" : "absent");
}
report("STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY?.startsWith("sk_live_") || env.STRIPE_SECRET_KEY?.startsWith("rk_live_") ? "live" : present("STRIPE_SECRET_KEY") ? "non-live/invalide" : "absent");
report("STRIPE_ENVIRONMENT", env.STRIPE_ENVIRONMENT === "live" ? "live" : present("STRIPE_ENVIRONMENT") ? "non-live/invalide" : "absent");
report("WORKOS_ENVIRONMENT", env.WORKOS_ENVIRONMENT === "production" ? "production déclaré" : present("WORKOS_ENVIRONMENT") ? "non-production/invalide" : "absent");
report("NEON_BRANCH", env.NEON_BRANCH === "production" ? "production déclarée" : present("NEON_BRANCH") ? "non-production/invalide" : "absent");
report("LEGAL_CONFIGURATION", isLegalReadyForLivePayments() ? "prête" : "incomplète");
report("CONSUMER_MEDIATOR", isConsumerMediatorConfigured() ? "configuré" : "WARNING — non désigné");

failures.push(...validateProductionEnvironment(env));
if (!isLegalReadyForLivePayments()) failures.push("LEGAL_CONFIGURATION: informations obligatoires incomplètes");
if (!isConsumerMediatorConfigured()) warnings.push("CONSUMER_MEDIATOR: médiateur de la consommation non désigné");

if (failures.length === 0) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  try {
    const expected = [
      [env.STRIPE_PRICE_ONE_SUN, 1990],
      [env.STRIPE_PRICE_THREE_SUNS, 4990],
    ];
    for (const [priceId, amount] of expected) {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.livemode || !price.active || price.type !== "one_time" || price.currency !== "eur" || price.unit_amount !== amount) {
        failures.push(`STRIPE_CATALOG: prix ${amount} centimes non conforme`);
      }
    }
    report("STRIPE_CATALOG", failures.some((item) => item.startsWith("STRIPE_CATALOG")) ? "invalide" : "2 prix live ponctuels vérifiés");
  } catch (error) {
    failures.push(`STRIPE_API: contrôle impossible (${error instanceof Error ? error.name : "erreur"})`);
    report("STRIPE_CATALOG", "contrôle impossible");
  }

  try {
    const requiredEvents = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
      "payment_intent.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
    ];
    const expectedUrl = `${env.APP_URL.replace(/\/$/, "")}/api/stripe/webhook`;
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const endpoint = endpoints.data.find((candidate) => candidate.url === expectedUrl && candidate.status === "enabled" && candidate.livemode);
    const enabledEvents = new Set(endpoint?.enabled_events ?? []);
    const missingEvents = requiredEvents.filter((event) => !enabledEvents.has(event) && !enabledEvents.has("*"));
    if (!endpoint) failures.push("STRIPE_WEBHOOK: endpoint Live actif introuvable");
    else if (missingEvents.length) failures.push(`STRIPE_WEBHOOK: événements requis manquants (${missingEvents.join(", ")})`);
    report("STRIPE_WEBHOOK", endpoint && missingEvents.length === 0 ? "endpoint Live et 7 événements vérifiés" : "invalide");
  } catch (error) {
    failures.push(`STRIPE_WEBHOOK_API: contrôle impossible (${error instanceof Error ? error.name : "erreur"})`);
    report("STRIPE_WEBHOOK", "contrôle impossible");
  }

  try {
    const response = await fetch("https://api.workos.com/user_management/users?limit=1", {
      headers: { Authorization: `Bearer ${env.WORKOS_API_KEY}` },
    });
    if (!response.ok) failures.push(`WORKOS_API: contrôle refusé (HTTP ${response.status})`);
    report("WORKOS_API", response.ok ? "clé acceptée" : "clé refusée");
  } catch (error) {
    failures.push(`WORKOS_API: contrôle impossible (${error instanceof Error ? error.name : "erreur"})`);
    report("WORKOS_API", "contrôle impossible");
  }

  try {
    const migrationsDirectory = path.resolve("db", "migrations");
    const files = (await readdir(migrationsDirectory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    const expectedMigrations = new Map();
    for (const filename of files) {
      const contents = await readFile(path.join(migrationsDirectory, filename), "utf8");
      expectedMigrations.set(filename, createHash("sha256").update(contents).digest("hex"));
    }
    const sql = neon(env.DATABASE_URL);
    const applied = await sql`SELECT filename, checksum FROM app_migrations ORDER BY filename`;
    for (const [filename, checksum] of expectedMigrations) {
      const row = applied.find((candidate) => candidate.filename === filename);
      if (!row) failures.push(`NEON_SCHEMA: migration absente ${filename}`);
      else if (row.checksum !== checksum) failures.push(`NEON_SCHEMA: checksum divergent ${filename}`);
    }
    const testRows = await sql`
      SELECT count(*)::int AS count FROM profiles
      WHERE auth_user_id LIKE 'test-%' OR email_normalized LIKE '%@example.invalid'
    `;
    if (testRows[0].count !== 0) failures.push("NEON_DATA: données de test détectées");
    report("NEON_SCHEMA", `${applied.length}/${files.length} migrations enregistrées`);
    report("NEON_TEST_DATA", testRows[0].count === 0 ? "absente" : "détectée");
  } catch (error) {
    failures.push(`NEON_READ_ONLY: contrôle impossible (${error instanceof Error ? error.name : "erreur"})`);
    report("NEON_SCHEMA", "contrôle impossible");
  }
}

if (warnings.length) {
  console.warn("Avertissements non bloquants :");
  for (const warning of [...new Set(warnings)]) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error("Préflight échoué :");
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Préflight Production réussi. Aucun paiement ni écriture en base n’a été effectué.");
}
