import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
export default function NotFound(){return <PageShell><section className="thank-you"><div className="shell narrow thank-card"><span className="eyebrow">Erreur 404</span><h1>Cette constellation reste introuvable</h1><p>La page demandée n’existe pas ou a changé d’adresse.</p><Link href="/" className="button">Retour à l’accueil</Link></div></section></PageShell>}
