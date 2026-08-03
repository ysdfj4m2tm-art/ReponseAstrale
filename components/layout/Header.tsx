"use client";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/content/site";
import { trackEvent } from "@/lib/analytics";

export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return <header className="site-header">
    <div className="shell header-inner">
      <Link href="/" className="brand-link" aria-label="RéponseAstrale, accueil"><Image src="/brand/logo-header.webp" width={220} height={81} priority unoptimized alt="RéponseAstrale" className="brand-full"/><Image src="/brand/symbol-mobile.png" width={50} height={50} unoptimized alt="" className="brand-compact"/></Link>
      <nav className="desktop-nav" aria-label="Navigation principale">{navItems.map((item)=><Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
      <Link href="/#analyse" className="button button--small header-cta" onClick={()=>trackEvent("cta_click",{location:"header"})}>Analyse gratuite</Link>
      <button className="menu-button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
    {open && <div className="mobile-overlay" onClick={()=>setOpen(false)}><nav id="mobile-menu" className="mobile-panel" aria-label="Navigation mobile" onClick={(e)=>e.stopPropagation()}><div className="mobile-panel-top"><span>Navigation</span><button onClick={()=>setOpen(false)} aria-label="Fermer le menu"><X/></button></div>{navItems.map((item)=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>{item.label}</Link>)}<Link href="/#analyse" className="button" onClick={()=>setOpen(false)}>Recevoir mon analyse</Link></nav></div>}
  </header>;
}
