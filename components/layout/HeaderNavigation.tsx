"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleUserRound, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SunTokenIcon } from "@/components/brand/SunTokenIcon";
import { navItems } from "@/content/site";
import { formatSunLabel } from "@/content/commerce";
import { trackEvent } from "@/lib/analytics";

export type HeaderAccount = { email: string; suns: number } | null;

export function HeaderNavigation({ account }: { account: HeaderAccount }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const authControl = account ? (
    <Link href="/espace" className="account-summary" aria-label={`Mon espace, ${formatSunLabel(account.suns)} restant${account.suns > 1 ? "s" : ""}`}>
      <CircleUserRound className="account-summary__user" />
      <span className="account-summary__identity"><small>Mon compte</small><strong title={account.email}>{account.email}</strong></span>
      <span className="account-summary__balance"><SunTokenIcon />{formatSunLabel(account.suns)}</span>
      <span className="account-summary__link">Mon espace</span>
    </Link>
  ) : <Link href="/connexion" className="header-login">Se connecter</Link>;

  return <><header className="site-header">
    <div className="shell header-inner">
      <Link href="/" className="brand-link" aria-label="RéponseAstrale, accueil"><Image src="/brand/logo-header.webp" width={220} height={81} priority unoptimized alt="RéponseAstrale" className="brand-full"/><Image src="/brand/symbol-mobile.png" width={50} height={50} unoptimized alt="" className="brand-compact"/></Link>
      <nav className="desktop-nav" aria-label="Navigation principale">{navItems.map((item)=><Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
      <div className="header-account-desktop">{authControl}</div>
      <div className="header-account-mobile">{account ? <Link href="/espace" className="mobile-account-trigger" aria-label={`Mon espace, ${formatSunLabel(account.suns)}`} title={account.email}><CircleUserRound/><span><SunTokenIcon/>{formatSunLabel(account.suns)}</span></Link> : <Link href="/connexion" className="header-login">Se connecter</Link>}</div>
      <Link href="/#analyse" className="button button--small header-cta" onClick={()=>trackEvent("cta_click",{location:"header"})}>Analyse gratuite</Link>
      <button className="menu-button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    </div>
  </header>{open && <div className="mobile-overlay" onClick={()=>setOpen(false)}><nav id="mobile-menu" className="mobile-panel" aria-label="Navigation mobile" onClick={(event)=>event.stopPropagation()}><div className="mobile-panel-top"><span>Navigation</span><button onClick={()=>setOpen(false)} aria-label="Fermer le menu"><X/></button></div><div className="mobile-account" onClick={()=>setOpen(false)}>{authControl}</div>{navItems.map((item)=><Link key={item.href} href={item.href} onClick={()=>setOpen(false)}>{item.label}</Link>)}<Link href="/#analyse" className="button" onClick={()=>setOpen(false)}>Recevoir mon analyse</Link></nav></div>}</>;
}
