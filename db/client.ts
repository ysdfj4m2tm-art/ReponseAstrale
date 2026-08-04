import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { requireServerEnv } from "@/lib/env";

export function getSqlClient() {
  const { DATABASE_URL } = requireServerEnv("DATABASE_URL");
  return neon(DATABASE_URL);
}

export function getDb() {
  return drizzle(getSqlClient(), { schema });
}
