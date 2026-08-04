import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

export default async function PurchasesPage() {
  const profile = await ensureProfile(await requireAuthenticatedUser());
  const sql = getSqlClient();
  const orders = await sql`SELECT product_code, amount_cents, status, paid_at, created_at FROM orders WHERE user_id=${profile.id}::uuid ORDER BY created_at DESC`;
  return <div className="account-panel"><h2>Mes achats</h2><div className="record-list">{orders.map((order, index)=><article key={index}><strong>{order.product_code === "three_suns" ? "3 Soleils" : "1 Soleil"}</strong><span>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(order.amount_cents)/100)}</span><span className="record-status">{String(order.status)}</span><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date((order.paid_at || order.created_at) as string))}</small></article>)}</div></div>;
}
