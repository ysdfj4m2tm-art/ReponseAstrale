import { AuthView } from "@neondatabase/auth-ui";
import { PageShell } from "@/components/layout/PageShell";
import { NEON_AUTH_SDK_SECURITY_APPROVED } from "@/lib/auth/security";

export default async function ConnexionPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  if (!NEON_AUTH_SDK_SECURITY_APPROVED) {
    return <PageShell><section className="section centered"><div className="status-card"><span className="eyebrow">Sécurité du compte</span><h1>Connexion temporairement indisponible</h1><p>L’accès est volontairement suspendu pendant la mise à jour de sécurité du SDK Neon Auth. Aucun paiement réel n’est ouvert.</p></div></section></PageShell>;
  }
  return (
    <PageShell>
      <section className="section account-shell">
        <div className="auth-card">
          <span className="eyebrow">Espace personnel</span>
          <h1>Accéder à mes réponses</h1>
          <p>Recevez un code à usage unique par e-mail. Aucun mot de passe n’est nécessaire.</p>
          <AuthView path={path} />
        </div>
      </section>
    </PageShell>
  );
}
