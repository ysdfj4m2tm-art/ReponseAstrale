import { LegalPage } from "@/components/layout/LegalPage";
import { legalConfig } from "@/content/legal";

export default function DataManagementPage() {
  return <LegalPage eyebrow="Vie privée" title="Gestion de vos données" intro="Des repères simples pour accéder à vos informations et exercer vos droits."><section><h2>Depuis votre espace</h2><p>Votre espace affiche vos achats, questions et réponses liés à votre e-mail vérifié. L’accès par code e-mail évite la gestion d’un mot de passe supplémentaire.</p></section><section><h2>Demander une action</h2><p>Écrivez à {legalConfig.publicEmail} depuis l’adresse concernée en précisant votre demande. Une vérification d’identité proportionnée peut être demandée. N’envoyez pas de document d’identité sans instruction explicite.</p></section><section><h2>Suppression et obligations légales</h2><p>Une suppression peut être limitée lorsqu’une conservation est nécessaire pour la facturation, la défense de droits ou une obligation légale. Les jetons d’accès peuvent être révoqués indépendamment du dossier.</p></section></LegalPage>;
}
