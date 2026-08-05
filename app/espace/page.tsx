import Link from "next/link";
import { SunTokenIcon } from "@/components/brand/SunTokenIcon";
import { formatSunLabel } from "@/content/commerce";
import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

export default async function AccountPage() {
  const profile = await ensureProfile(await requireAuthenticatedUser());
  const sql = getSqlClient();
  const [summary] = await sql`
    SELECT COALESCE(sum(quantity_remaining) FILTER (WHERE status='active' AND expires_at > now()), 0)::int AS suns,
      min(expires_at) FILTER (WHERE status='active' AND quantity_remaining > 0 AND expires_at > now()) AS next_expiry
    FROM sun_entitlements WHERE user_id = ${profile.id}::uuid
  `;
  const suns = Number(summary.suns);
  return <div className="dashboard-grid"><article className="dashboard-card dashboard-card--suns"><span>Soleils disponibles</span><div className="dashboard-sun-total"><SunTokenIcon label="Soleil"/><strong>{formatSunLabel(suns)}</strong></div><p>1 Soleil = 1 question personnelle.</p><Link href="/espace/questions">Poser une question</Link></article><article className="dashboard-card"><span>Prochaine expiration</span><strong className="dashboard-date">{summary.next_expiry ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(summary.next_expiry as string)) : "—"}</strong><p>Les questions envoyées avant l’expiration restent traitées.</p><Link href="/exploration">Acheter des Soleils</Link></article></div>;
}
