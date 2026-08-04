import type { ReactNode } from "react";
import Link from "next/link";
import { PageShell } from "./PageShell";
export function LegalPage({eyebrow,title,intro,children}:{eyebrow:string;title:string;intro:string;children:ReactNode}){return <PageShell><div className="page-hero page-hero--compact"><div className="shell narrow"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></div><article className="shell narrow legal-content">{children}<p className="legal-note">Certaines informations juridiques seront complétées avant l’ouverture commerciale définitive.</p><Link className="text-link" href="/contact">Une question ? Contactez-nous →</Link></article></PageShell>}
