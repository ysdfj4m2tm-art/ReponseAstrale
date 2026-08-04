import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

export default function PaymentCancelledPage() {
  return <PageShell><section className="section centered"><div className="status-card"><span className="eyebrow">Paiement annulé</span><h1>Aucun débit effectué</h1><p>Votre commande reste sans paiement et aucun Soleil n’a été accordé.</p><Link className="button" href="/exploration">Revenir aux offres</Link></div></section></PageShell>;
}
