import Link from "next/link";

export function AccountNav() {
  return <nav className="account-nav" aria-label="Espace personnel"><Link href="/espace">Vue d’ensemble</Link><Link href="/espace/questions">Mes questions</Link><Link href="/espace/reponses">Mes réponses</Link><Link href="/espace/achats">Mes achats</Link><Link href="/espace/donnees">Mes données</Link></nav>;
}
