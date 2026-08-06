import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localEnv = path.join(root, ".env.local");
if (existsSync(localEnv)) loadEnvFile(localEnv);

if (process.env.NEON_BRANCH !== "codex-sales-funnel" && process.env.NEON_BRANCH !== "production") {
  throw new Error("Vérification refusée : branche Neon inattendue.");
}
if (!process.env.DATABASE_URL_UNPOOLED) {
  throw new Error("DATABASE_URL_UNPOOLED est requis.");
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const expectedTables = [
  "answers",
  "chart_access_tokens",
  "charts",
  "commercial_events",
  "legal_acceptances",
  "orders",
  "products",
  "profiles",
  "questions",
  "retraction_requests",
  "stripe_events",
  "sun_entitlements",
];

const tables = await sql`
  SELECT tablename
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public' AND tablename = ANY(${expectedTables})
  ORDER BY tablename
`;
const functions = await sql`
  SELECT proname
  FROM pg_proc
  JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
  WHERE pg_namespace.nspname = 'public'
    AND proname = ANY(${[
      "claim_paid_orders_for_profile",
      "consume_sun_for_question",
      "expire_sun_entitlements",
      "grant_suns_for_paid_order",
      "record_checkout_expiration",
      "record_order_dispute",
      "record_order_payment_failure",
      "record_order_refund",
      "restore_sun_for_question",
      "submit_paid_question",
    ]})
  ORDER BY proname
`;

if (tables.length !== expectedTables.length) {
  throw new Error(`Schéma incomplet : ${tables.length}/${expectedTables.length} tables métier.`);
}
if (functions.length !== 10) {
  throw new Error(`Fonctions transactionnelles incomplètes : ${functions.length}/10.`);
}

if (process.env.NEON_BRANCH === "production") {
  const testRows = await sql`
    SELECT count(*)::int AS count FROM profiles
    WHERE auth_user_id LIKE 'test-%' OR email_normalized LIKE '%@example.invalid'
  `;
  if (testRows[0].count !== 0) throw new Error("Données de test détectées sur la branche Production.");
}

console.log(`Branche vérifiée : ${process.env.NEON_BRANCH}`);
console.log(`Tables métier vérifiées : ${tables.length}`);
console.log(`Fonctions transactionnelles vérifiées : ${functions.length}`);
