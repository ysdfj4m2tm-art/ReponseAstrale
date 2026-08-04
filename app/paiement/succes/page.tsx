import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

export default function PaymentSuccessPage() {
  return <PageShell><section className="section centered"><div className="status-card"><span className="eyebrow">Paiement reçu</span><h1>Vos Soleils arrivent</h1><p>La confirmation du paiement est traitée de manière sécurisée. Connectez-vous avec la même adresse e-mail pour retrouver vos Soleils — ils ne sont jamais accordés à partir de cette page seule.</p><Link className="button" href="/connexion/sign-in">Accéder à mon espace</Link></div></section></PageShell>;
}
