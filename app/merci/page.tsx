import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { ConfirmationSummary } from "@/components/form/ConfirmationSummary";
import { PageShell } from "@/components/layout/PageShell";
import { siteConfig } from "@/content/site";
export const metadata:Metadata={title:"Votre demande a bien été transmise",robots:{index:false,follow:false}};
export default function Page(){return <PageShell><section className="thank-you"><div className="shell narrow thank-card"><CheckCircle2/><span className="eyebrow">Demande reçue</span><h1>Votre demande a bien été transmise</h1><p>Merci. Votre analyse va maintenant être examinée individuellement. Vous recevrez votre profil astral et la réponse à votre question par e-mail sous {siteConfig.processingDelay} en période normale.</p>{siteConfig.highDemand&&<p className="gentle-warning">{siteConfig.highDemandMessage}</p>}<ConfirmationSummary/><div className="thank-note"><Mail/><p>Pensez à vérifier votre dossier de courriers indésirables. Il n’est pas nécessaire de soumettre une nouvelle demande si le délai dépasse exceptionnellement 48 heures : votre dossier reste enregistré et sera traité dès la reprise normale du service.</p></div><p>Une erreur dans vos informations ? Écrivez à <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> en indiquant votre numéro de dossier.</p><Link href="/" className="button button--secondary"><ArrowLeft/>Retour à l’accueil</Link></div></section></PageShell>}
