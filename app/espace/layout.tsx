import { AccountNav } from "@/components/account/AccountNav";
import { PageShell } from "@/components/layout/PageShell";
import { requireAuthenticatedUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireAuthenticatedUser();
  return <PageShell><section className="section account-shell"><div className="shell"><div className="account-heading"><span className="eyebrow">Espace personnel</span><h1>Mon espace RéponseAstrale</h1></div><AccountNav />{children}</div></section></PageShell>;
}
