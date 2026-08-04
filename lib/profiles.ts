import { getSqlClient } from "@/db/client";
import type { AuthenticatedUser } from "@/lib/auth/server";
import { normalizeEmail } from "@/lib/env";

export type Profile = { id: string; auth_user_id: string; email_normalized: string; first_name: string | null };

export async function ensureProfile(user: AuthenticatedUser): Promise<Profile> {
  if (!user.emailVerified) {
    throw new Error("VERIFIED_EMAIL_REQUIRED");
  }
  const sql = getSqlClient();
  const email = normalizeEmail(user.email);
  const rows = await sql`
    INSERT INTO profiles (auth_user_id, email_normalized, first_name)
    VALUES (${user.id}, ${email}, ${user.name ?? null})
    ON CONFLICT (auth_user_id) DO UPDATE SET
      email_normalized = EXCLUDED.email_normalized,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      updated_at = now()
    RETURNING id, auth_user_id, email_normalized, first_name
  `;
  const profile = rows[0] as Profile;
  await sql`SELECT claim_paid_orders_for_profile(${profile.id}::uuid)`;
  return profile;
}
