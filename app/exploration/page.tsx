import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { PageShell } from "@/components/layout/PageShell";
import { sunRule } from "@/content/commerce";
import { getAuthenticatedUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Poursuivre mon exploration", robots: { index: false, follow: false } };

export default async function ExplorationPage({ searchParams }: { searchParams: Promise<{ token?: string; access?: string }> }) {
  const { token, access } = await searchParams;
  const user = await getAuthenticatedUser();
  return <PageShell><section className="section commercial-hero"><div className="shell">{user?.emailVerified && <Link href="/espace" className="back-to-account">← Retour à mon espace</Link>}<div className="commercial-grid"><div>
    <span className="eyebrow">Poursuivre votre exploration</span><h1>Posez une nouvelle question personnelle</h1>
    <p className="commercial-lead">{sunRule} Les Soleils sont rattachés à l’adresse e-mail utilisée lors du paiement, puis à votre espace après vérification.</p>
    <ul className="trust-list"><li>Accès immédiat après confirmation du paiement</li><li>1 Soleil : 7 jours · 3 Soleils : 30 jours</li><li>Question transmise de façon confidentielle</li></ul>
  </div><CheckoutForm chartToken={token || access} /></div></div></section></PageShell>;
}
