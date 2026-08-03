import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { faqItems } from "@/content/faq";

export const metadata:Metadata={title:"Questions fréquentes",description:"Tout savoir sur la première analyse astrologique gratuite, les délais, la confidentialité, l’heure de naissance et les limites de RéponseAstrale.",alternates:{canonical:"/faq"}};
export default function Page(){const schema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faqItems.map(x=>({"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}}))};return <PageShell><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><div className="page-hero"><div className="shell narrow"><span className="eyebrow">Questions fréquentes</span><h1>Des réponses claires avant de commencer</h1><p>Gratuité, confidentialité, délai, fonctionnement : voici les repères essentiels pour avancer en confiance.</p></div></div><section className="section"><div className="shell narrow faq-page">{faqItems.map((item)=><details key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}<div className="article-cta"><div><h2>Votre question n’est pas ici ?</h2><p>Découvrez les domaines que vous pouvez explorer ou écrivez-nous depuis la page Contact.</p></div><Link href="/questions-possibles" className="button">Voir les questions <ArrowRight/></Link></div></div></section></PageShell>}
