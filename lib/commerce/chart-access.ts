import { getSqlClient } from "@/db/client";
import { hashOpaqueToken } from "@/lib/security";

export async function resolveChartToken(token?: string) {
  if (!token || token.length < 32 || token.length > 256) return null;
  const sql = getSqlClient();
  const rows = await sql`
    SELECT chart_id
    FROM chart_access_tokens
    WHERE token_hash = ${hashOpaqueToken(token)} AND revoked_at IS NULL AND expires_at > now()
    LIMIT 1
  `;
  return (rows[0]?.chart_id as string | undefined) ?? null;
}
