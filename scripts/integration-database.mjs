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
  const otherProfile = (await client.query("INSERT INTO profiles(auth_user_id,email_normalized) VALUES($1,$2) RETURNING id", [`other-${marker}`, `other-${email}`])).rows[0];
  const otherChart = (await client.query("INSERT INTO charts(user_id,first_name,birth_date,birth_place,birth_country) VALUES($1,'Autre','2001-01-01','Paris','France') RETURNING id", [otherProfile.id])).rows[0];

  const order = (await client.query("SELECT * FROM create_pending_order($1,'one_sun',NULL,'test','test','test')", [email])).rows[0];
  assert.equal(order.amount_cents, 1990);
  await client.query("SELECT grant_suns_for_paid_order($1,$2,$3,$4,now())", [order.order_id, `cs_${marker}`, `pi_${marker}`, null]);
  await client.query("SELECT claim_paid_orders_for_profile($1)", [profile.id]);

  const question = "Une question suffisamment longue pour tester la création atomique.";
  const first = (await client.query(
    "SELECT * FROM submit_paid_question($1,NULL,$2,$3,NULL,false,$4,$5,$6,$7,$8)",
    [profile.id, "Camille", "1990-05-05", "Lille", "France", "amour", question, marker],
  )).rows[0];
  const replay = (await client.query(
    "SELECT * FROM submit_paid_question($1,NULL,$2,$3,NULL,false,$4,$5,$6,$7,$8)",
    [profile.id, "Camille", "1990-05-05", "Lille", "France", "amour", question, marker],
  )).rows[0];
  assert.equal(first.question_id, replay.question_id, "un retry doit retourner la même question");
  assert.equal(replay.replayed, true);
  assert.equal(first.quantity_remaining, 0);

  const chart = (await client.query("SELECT * FROM charts WHERE id=$1", [first.chart_id])).rows[0];
  assert.match(chart.external_case_id, /^[0-9a-f-]{36}$/i);
  assert.equal(chart.user_id, profile.id);
  assert.equal(chart.birth_time, null);
  assert.equal(chart.birth_time_known, false);
  assert.equal(chart.timezone, null);
  assert.equal(chart.chart_data_json, null);
  assert.equal(chart.calculation_status, "pending_calculation");
  const storedQuestion = (await client.query("SELECT * FROM questions WHERE id=$1", [first.question_id])).rows[0];
  assert.equal(storedQuestion.category, "amour");
  assert.equal(storedQuestion.status, "submitted");
  assert.equal(storedQuestion.chart_id, chart.id);
  assert.equal(storedQuestion.entitlement_id, first.entitlement_id);

  await client.query("SAVEPOINT idempotency_conflict");
  await assert.rejects(client.query(
    "SELECT * FROM submit_paid_question($1,NULL,$2,$3,NULL,false,$4,$5,$6,$7,$8)",
    [profile.id, "Camille", "1990-05-05", "Lille", "France", "amour", `${question} Modifiée.`, marker],
  ), /IDEMPOTENCY_CONFLICT/);
  await client.query("ROLLBACK TO SAVEPOINT idempotency_conflict");

  await client.query("SELECT restore_sun_for_question($1,'test du thème existant')", [first.question_id]);
  const existing = (await client.query(
    "SELECT * FROM submit_paid_question($1,$2,NULL,NULL,NULL,false,NULL,NULL,$3,$4,$5)",
    [profile.id, chart.id, "travail", "Une seconde question suffisamment longue sur le même thème.", `existing-${marker}`],
  )).rows[0];
  assert.equal(existing.chart_id, chart.id);
  assert.equal((await client.query("SELECT count(*)::int AS count FROM charts WHERE user_id=$1", [profile.id])).rows[0].count, 1, "aucun thème ne doit être recréé");
  await client.query("SELECT restore_sun_for_question($1,'suite des tests')", [existing.question_id]);

  await client.query("SAVEPOINT forbidden_chart");
  await assert.rejects(client.query(
    "SELECT * FROM submit_paid_question($1,$2,NULL,NULL,NULL,false,NULL,NULL,$3,$4,$5)",
    [profile.id, otherChart.id, "autre", "Question interdite sur le thème d’un autre compte.", `forbidden-${marker}`],
  ), /CHART_FORBIDDEN/);
  await client.query("ROLLBACK TO SAVEPOINT forbidden_chart");

  const beforeFailure = (await client.query("SELECT quantity_remaining FROM sun_entitlements WHERE id=$1", [first.entitlement_id])).rows[0].quantity_remaining;
  await client.query("SAVEPOINT failed_question");
  await assert.rejects(client.query(
    "SELECT * FROM submit_paid_question($1,$2,NULL,NULL,NULL,false,NULL,NULL,$3,$4,$5)",
    [profile.id, chart.id, "autre", "trop court", `failure-${marker}`],
  ));
  await client.query("ROLLBACK TO SAVEPOINT failed_question");
  assert.equal((await client.query("SELECT quantity_remaining FROM sun_entitlements WHERE id=$1", [first.entitlement_id])).rows[0].quantity_remaining, beforeFailure, "une question invalide ne doit pas consommer de Soleil");

  await client.query("UPDATE sun_entitlements SET expires_at=now()-interval '1 minute', status='active' WHERE id=$1", [first.entitlement_id]);
  await client.query("SAVEPOINT expired_sun");
  await assert.rejects(client.query(
    "SELECT * FROM submit_paid_question($1,$2,NULL,NULL,NULL,false,NULL,NULL,$3,$4,$5)",
    [profile.id, chart.id, "autre", "Question refusée parce que le Soleil vient d’expirer.", `expired-${marker}`],
  ), /SUN_EXPIRED/);
  await client.query("ROLLBACK TO SAVEPOINT expired_sun");

  const emptyProfile = (await client.query("INSERT INTO profiles(auth_user_id,email_normalized) VALUES($1,$2) RETURNING id", [`empty-${marker}`, `empty-${email}`])).rows[0];
  await client.query("SAVEPOINT no_sun");
  await assert.rejects(client.query(
    "SELECT * FROM submit_paid_question($1,NULL,$2,$3,NULL,false,$4,$5,$6,$7,$8)",
    [emptyProfile.id, "Ariane", "1990-01-01", "Paris", "France", "autre", "Question valide mais sans aucun Soleil disponible.", `none-${marker}`],
  ), /NO_ACTIVE_SUN/);
  await client.query("ROLLBACK TO SAVEPOINT no_sun");

  await client.query("ROLLBACK");
  console.log("Intégration Neon validée avec rollback : création de thème, question, FIFO, idempotence, isolation et atomicité.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release(); await pool.end();
}
