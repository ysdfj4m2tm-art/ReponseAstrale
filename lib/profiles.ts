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
    WITH updated_by_workos_id AS (
      UPDATE profiles SET
        email_normalized = ${email},
        first_name = COALESCE(${user.name ?? null}, first_name),
        updated_at = now()
      WHERE auth_user_id = ${user.id} AND deleted_at IS NULL
      RETURNING id, auth_user_id, email_normalized, first_name
    ), inserted_or_relinked AS (
      INSERT INTO profiles (auth_user_id, email_normalized, first_name)
      SELECT ${user.id}, ${email}, ${user.name ?? null}
      WHERE NOT EXISTS (SELECT 1 FROM updated_by_workos_id)
      ON CONFLICT (email_normalized) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        updated_at = now()
      WHERE profiles.deleted_at IS NULL
      RETURNING id, auth_user_id, email_normalized, first_name
    )
    SELECT * FROM updated_by_workos_id
    UNION ALL
    SELECT * FROM inserted_or_relinked
    LIMIT 1
  `;
  const profile = rows[0] as Profile;
  if (!profile) throw new Error("PROFILE_LINK_CONFLICT");
  await sql`SELECT claim_paid_orders_for_profile(${profile.id}::uuid)`;
  return profile;
}
