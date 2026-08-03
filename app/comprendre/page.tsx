import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Orbit, PieChart, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { understandPages } from "@/content/seo-pages";

export const metadata: Metadata={title:"Comprendre l’astrologie",description:"Un centre éditorial clair pour comprendre le thème astral, les planètes, les maisons, les aspects et la voyance astrologique.",alternates:{canonical:"/comprendre"}};
const icons=[Compass,Orbit,PieChart,Sparkles,BookOpen];
export default function Page(){return <PageShell><div className="page-hero"><div className="shell narrow"><span className="eyebrow">Centre éditorial</span><h1>Comprendre l’astrologie avec clarté</h1><p>Des repères accessibles pour découvrir le langage du thème astral, sans raccourci, sans promesse catégorique et sans jargon inutile.</p></div></div><section className="section"><div className="shell editorial-grid">{understandPages.map((page,i)=>{const Icon=icons[i];return <article key={page.slug}><Icon/><span className="eyebrow">Guide</span><h2>{page.title}</h2><p>{page.description}</p><Link href={`/comprendre/${page.slug}`} className="text-link">Lire le guide <ArrowRight/></Link></article>})}</div></section></PageShell>}
