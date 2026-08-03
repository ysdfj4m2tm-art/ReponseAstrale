"use client";
import { useSyncExternalStore } from "react";

type Summary = { dossierId: string; category: string; question: string; delay: string };
export function ConfirmationSummary(){const mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false);let summary:Summary|null=null;if(mounted){try{const raw=sessionStorage.getItem("reponseastrale-confirmation");if(raw)summary=JSON.parse(raw);}catch{}}if(!summary)return <p>Votre confirmation ne contient pas de données enregistrées sur cet appareil. Si vous venez d’envoyer le formulaire, votre demande reste bien prise en compte.</p>;return <div className="confirmation-summary"><div><span>Numéro de dossier</span><strong>{summary.dossierId}</strong></div><div><span>Catégorie</span><strong>{summary.category}</strong></div><div><span>Votre question</span><strong>{summary.question}</strong></div><div><span>Délai annoncé</span><strong>{summary.delay}</strong></div></div>}
