import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, MailCheck, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Connexion sécurisée", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  return <PageShell><section className="section auth-entry"><div className="shell auth-entry__layout"><div className="auth-entry__intro">
    <span className="eyebrow">Votre espace personnel</span>
    <h1>Retrouvez votre espace et vos Soleils</h1>
    <p>Consultez vos questions, vos réponses et votre solde dans un espace confidentiel relié à votre adresse e-mail.</p>
    <div className="auth-entry__trust"><span><ShieldCheck/>Session protégée</span><span><LockKeyhole/>Aucun mot de passe à retenir</span></div>
  </div><div className="auth-card auth-card--branded">
    <span className="auth-card__icon"><MailCheck/></span>
    <span className="eyebrow">Connexion sécurisée</span>
    <h2>Recevez votre code par e-mail</h2>
    <p>Vous allez poursuivre vers notre écran d’authentification sécurisé. Saisissez l’adresse utilisée pour votre espace RéponseAstrale, puis le code reçu par e-mail.</p>
    <Link href="/connexion/demarrer?returnTo=%2Fespace" className="button">Continuer vers la connexion <ArrowRight/></Link>
    <small>Sécurisé par WorkOS · Le code est temporaire et personnel.</small>
  </div></div></section></PageShell>;
}
