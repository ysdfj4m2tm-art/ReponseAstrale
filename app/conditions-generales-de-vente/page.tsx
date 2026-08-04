import { LegalPage } from "@/components/layout/LegalPage";
import { commerceProducts, formatEuro, sunRule } from "@/content/commerce";
import { executionConsentText, legalConfig } from "@/content/legal";

export const metadata = { title: "Conditions générales de vente", robots: { index: false, follow: true } };

export default function TermsOfSalePage() {
  return <LegalPage eyebrow={`Version ${legalConfig.cgvVersion}`} title="Conditions générales de vente" intro="Conditions applicables aux achats de Soleils sur RéponseAstrale.">
    <section><h2>Vendeur et champ d’application</h2><p>{legalConfig.companyName}, {legalConfig.legalForm}, capital {legalConfig.shareCapital}, SIREN {legalConfig.siren}, RCS {legalConfig.rcs}, exploitant de RéponseAstrale, Métropole lilloise. Contact : {legalConfig.publicEmail}.</p></section>
    <section><h2>Offres et prix</h2><p>{sunRule}</p><ul>{Object.values(commerceProducts).map((p)=><li key={p.code}><strong>{p.name} — {formatEuro(p.priceCents)} TTC</strong> : {p.sunCount} question{p.sunCount > 1 ? "s" : ""}, validité {p.validityDays} jours après paiement.</li>)}</ul><p>Le contenu d’une question transmise avant l’expiration peut être traité après cette date. Un Soleil expiré ou déjà consommé n’est pas réutilisable, sauf restauration décidée après un échec technique éligible.</p></section>
    <section><h2>Commande, paiement et délivrance</h2><p>Le client choisit une offre, renseigne son e-mail, accepte les présentes conditions et confirme sa demande d’exécution immédiate. Stripe traite le paiement. Les Soleils ne sont accordés qu’après confirmation serveur signée du paiement, puis rattachés à l’e-mail vérifié du client.</p></section>
    <section><h2>Exécution immédiate et rétractation</h2><p>{executionConsentText}</p><p>La simple acquisition d’un Soleil et son utilisation pour soumettre une question sont deux étapes distinctes. Toute demande est examinée selon son état d’exécution et le droit applicable. Le formulaire est disponible sur la page Rétractation.</p></section>
    <section><h2>Service, limites et responsabilité</h2><p>Les contenus astrologiques relèvent d’une lecture symbolique et de divertissement. Ils ne remplacent pas un avis médical, psychologique, juridique ou financier. Le client reste responsable de ses décisions. En cas d’incident, contactez {legalConfig.publicEmail}.</p></section>
    <section><h2>Médiation et droit applicable</h2><p>Les coordonnées du médiateur de la consommation seront complétées avant l’ouverture commerciale définitive. Le droit français s’applique, sous réserve des protections impératives du consommateur.</p></section>
  </LegalPage>;
}
