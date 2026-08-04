import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

if (existsSync(path.resolve(".env.local"))) loadEnvFile(path.resolve(".env.local"));
if (process.env.NEON_BRANCH !== "codex-sales-funnel") throw new Error("Test refusé hors codex-sales-funnel.");
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error("DATABASE_URL_UNPOOLED requis.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const marker = randomUUID();
  const email = `integration-${marker}@example.invalid`;
  const profile = (await client.query("INSERT INTO profiles(auth_user_id,email_normalized) VALUES($1,$2) RETURNING id", [`test-${marker}`, email])).rows[0];
  const chart = (await client.query("INSERT INTO charts(user_id,first_name,birth_date,birth_place,timezone) VALUES($1,'Test','2000-01-01','Lille','Europe/Paris') RETURNING id", [profile.id])).rows[0];
  const order = (await client.query("SELECT * FROM create_pending_order($1,'one_sun',$2,'test','test','test')", [email, chart.id])).rows[0];
  assert.equal(order.amount_cents, 1990);
  await client.query("SELECT grant_suns_for_paid_order($1,$2,$3,$4,now())", [order.order_id, `cs_${marker}`, `pi_${marker}`, null]);
  await client.query("SELECT claim_paid_orders_for_profile($1)", [profile.id]);
  const first = (await client.query("SELECT * FROM consume_sun_for_question($1,$2,$3,$4)", [profile.id, chart.id, "Une question suffisamment longue pour le test.", marker])).rows[0];
  const replay = (await client.query("SELECT * FROM consume_sun_for_question($1,$2,$3,$4)", [profile.id, chart.id, "Une question suffisamment longue pour le test.", marker])).rows[0];
  assert.equal(first.question_id, replay.question_id, "l’idempotence doit conserver la même question");
  assert.equal(first.quantity_remaining, 0);
  const restored = (await client.query("SELECT restore_sun_for_question($1,'incident avant traitement') AS restored", [first.question_id])).rows[0];
  const restoredAgain = (await client.query("SELECT restore_sun_for_question($1,'nouvelle tentative') AS restored", [first.question_id])).rows[0];
  assert.equal(restored.restored, true, "le Soleil doit être restauré avant traitement");
  assert.equal(restoredAgain.restored, false, "la restauration doit être idempotente");
  const balance = (await client.query("SELECT quantity_remaining FROM sun_entitlements WHERE order_id=$1", [order.order_id])).rows[0];
  assert.equal(balance.quantity_remaining, 1);
  const entitlement = (await client.query("SELECT expires_at-paid_at AS validity FROM sun_entitlements JOIN orders ON orders.id=sun_entitlements.order_id WHERE sun_entitlements.order_id=$1", [order.order_id])).rows[0];
  assert.equal(Math.round(Number(entitlement.validity.days)), 7);
  await client.query("ROLLBACK");
  console.log("Intégration Neon validée avec rollback : commande, attribution, consommation et restauration idempotentes.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release(); await pool.end();
}
