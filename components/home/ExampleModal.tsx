"use client";
import { useRef } from "react";
import { X } from "lucide-react";
import { vanyaSections } from "@/content/vanya-example";
import { trackEvent } from "@/lib/analytics";

export function ExampleModal({ variant = "secondary" }: { variant?: "secondary" | "text" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const open = () => { ref.current?.showModal(); trackEvent("example_open"); };
  const close = () => { ref.current?.close(); trigger.current?.focus(); };
  return <>
    <button ref={trigger} type="button" onClick={open} className={variant === "text" ? "button button--light" : "button button--secondary"}>Voir un exemple anonymisé</button>
    <dialog ref={ref} className="example-dialog" onClick={(e)=>{if(e.target===ref.current) close();}} onKeyDown={(e)=>{if(e.key==="Escape"){e.preventDefault();close();}}} onCancel={(e)=>{e.preventDefault();close();}} onClose={()=>trigger.current?.focus()}>
      <div className="dialog-card"><header><div><span className="eyebrow">Exemple réel anonymisé</span><h2>Une lecture détaillée du thème de Vanya</h2></div><button type="button" onClick={close} aria-label="Fermer l’exemple"><X/></button></header><div className="dialog-content"><div className="dialog-intro"><strong>Pour préserver la confidentialité de la personne, son prénom a été remplacé par « Vanya ».</strong><p>Certains détails permettant de l’identifier ont également été retirés. Cet exemple illustre le niveau de détail d’une interprétation RéponseAstrale. L’astrologie est utilisée ici comme un système symbolique de réflexion : cette lecture ne constitue ni une vérité scientifique, ni une prédiction certaine.</p></div>{vanyaSections.map((section)=><section key={section.title}><h3>{section.title}</h3>{section.paragraphs.map((p)=><p key={p}>{p}</p>)}</section>)}<button type="button" className="button" onClick={close}>Fermer l’exemple</button></div></div>
    </dialog>
  </>;
}
