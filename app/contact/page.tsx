import type { Metadata } from "next";
import { Mail, Clock3 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ContactEmail } from "@/components/ui/ContactEmail";
export const metadata:Metadata={title:"Contact",description:"Contacter RéponseAstrale au sujet d’une demande, d’une correction ou de vos données personnelles.",alternates:{canonical:"/contact"}};
export default function Page(){return <PageShell><div className="page-hero"><div className="shell narrow"><span className="eyebrow">Nous écrire</span><h1>Contact</h1><p>Pour toute question concernant une demande, une correction ou vos données personnelles, écrivez à notre adresse de contact.</p></div></div><section className="section"><div className="shell narrow contact-card"><Mail/><h2>Une seule adresse pour vous répondre</h2><ContactEmail/><p><Clock3/> Nous répondons généralement sous 24 à 48 heures.</p><small>Si votre message concerne une analyse déjà envoyée, indiquez votre numéro de dossier afin de faciliter la recherche.</small></div></section></PageShell>}
