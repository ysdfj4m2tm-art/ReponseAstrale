import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localEnv = path.join(root, ".env.local");
if (existsSync(localEnv)) loadEnvFile(localEnv);

const targetBranch = process.env.NEON_BRANCH;
if (targetBranch !== "codex-sales-funnel" && targetBranch !== "production") {
  throw new Error("Migration refusée : NEON_BRANCH doit identifier explicitement codex-sales-funnel ou production.");
}
if (targetBranch === "production" && process.env.CONFIRM_PRODUCTION_MIGRATION !== "APPLY_VERSIONED_MIGRATIONS") {
  throw new Error("Migration Production refusée : autorisation explicite absente.");
}

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED est requis.");

const migrationsDirectory = path.join(root, "db", "migrations");
const files = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();

const pool = new Pool({ connectionString, max: 1 });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  for (const filename of files) {
    const sql = await readFile(path.join(migrationsDirectory, filename), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM app_migrations WHERE filename = $1",
      [filename],
    );

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration déjà appliquée mais modifiée : ${filename}`);
      }
      console.log(`Déjà appliquée : ${filename}`);
      continue;
    }

    await client.query(sql);
    await client.query(
      "INSERT INTO app_migrations (filename, checksum) VALUES ($1, $2)",
      [filename, checksum],
    );
    console.log(`Appliquée : ${filename}`);
  }

  await client.query("COMMIT");
  console.log(`Migrations versionnées terminées sur ${targetBranch}.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
