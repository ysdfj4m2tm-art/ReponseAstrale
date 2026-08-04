import Link from "next/link";
import { requireAuthenticatedUser } from "@/lib/auth/server";

export default async function DataPage() {
  const user = await requireAuthenticatedUser();
  return <div className="account-panel prose-panel"><h2>Mes données</h2><p>Compte associé à <strong>{user.email}</strong>. Vous pouvez demander l’accès, la rectification ou l’effacement de vos données. Certaines informations de facturation doivent être conservées pendant les durées légales.</p><p><Link href="/gestion-des-donnees">Comprendre la gestion de mes données</Link></p><p><Link href="/contact">Exercer un droit auprès de RéponseAstrale</Link></p></div>;
}
