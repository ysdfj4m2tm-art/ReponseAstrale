import { getSqlClient } from "@/db/client";
import { getAuthenticatedUser } from "@/lib/auth/server";
import { normalizeEmail } from "@/lib/env";
import { HeaderNavigation, type HeaderAccount } from "./HeaderNavigation";

export async function Header() {
  const user = await getAuthenticatedUser();
  let account: HeaderAccount = null;

  if (user?.emailVerified) {
    const sql = getSqlClient();
    const [summary] = await sql`
      SELECT COALESCE(SUM(se.quantity_remaining) FILTER (
        WHERE se.status = 'active' AND se.expires_at > now()
      ), 0)::integer AS suns
      FROM profiles p
      LEFT JOIN sun_entitlements se ON se.user_id = p.id
      WHERE p.deleted_at IS NULL
        AND (p.auth_user_id = ${user.id} OR p.email_normalized = ${normalizeEmail(user.email)})
    `;
    account = { email: user.email, suns: Number(summary?.suns ?? 0) };
  }

  return <HeaderNavigation account={account} />;
}
