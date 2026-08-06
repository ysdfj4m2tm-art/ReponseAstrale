import { RetractionForm } from "@/components/commerce/RetractionForm";
import { LegalPage } from "@/components/layout/LegalPage";
import { legalConfig } from "@/content/legal";
export default function RetractionPage(){return <LegalPage eyebrow="Droit du consommateur" title="Demande de rétractation" intro="Ce formulaire est accessible sans compte. L’e-mail et la référence de paiement permettent de retrouver la commande sans révéler son existence."><section><h2>Avant d’envoyer</h2><p>Indiquez l’e-mail utilisé et une référence figurant sur votre reçu. L’éligibilité dépend notamment de la date, de l’utilisation des Soleils et de l’état d’exécution du service. Contact direct : {legalConfig.publicEmail}.</p></section><section><h2>Formulaire</h2><RetractionForm/></section></LegalPage>}
