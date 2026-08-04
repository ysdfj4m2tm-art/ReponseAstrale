"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuestionForm({ charts }: { charts: { id: string; label: string }[] }) {
  const router = useRouter();
  const [chartId, setChartId] = useState(charts[0]?.id ?? "");
  const [questionText, setQuestionText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    const response = await fetch("/api/questions", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() }, body: JSON.stringify({ chartId, questionText }) });
    const result = await response.json();
    setPending(false);
    if (!response.ok) return setMessage(result.error === "NO_ACTIVE_SUN" ? "Vous n’avez aucun Soleil actif pour ce dossier." : result.error === "SENSITIVE_CONTENT_REFORMULATE" ? "Pour protéger votre vie privée, reformulez votre question sans donnée personnelle sensible ni document." : "La question n’a pas pu être envoyée.");
    setQuestionText(""); setMessage("Question envoyée. Un Soleil a été utilisé."); router.refresh();
  }
  if (!charts.length) return <p>Aucun thème astral n’est encore relié à ce compte. Contactez-nous avec votre numéro de dossier.</p>;
  return <form className="question-form" onSubmit={submit}><label className="field-label">Dossier<select value={chartId} onChange={(e)=>setChartId(e.target.value)}>{charts.map((chart)=><option value={chart.id} key={chart.id}>{chart.label}</option>)}</select></label><label className="field-label">Votre question<textarea minLength={20} maxLength={2000} required value={questionText} onChange={(e)=>setQuestionText(e.target.value)} /><small>Ne transmettez pas de donnée médicale, judiciaire, bancaire, de mot de passe, de document officiel ni d’information sensible concernant une autre personne. Limitez votre contexte aux éléments utiles à votre question.</small><small>Pour protéger votre vie privée, RéponseAstrale peut demander la reformulation ou refuser un contenu contenant des données sensibles.</small></label><button className="button" disabled={pending}>{pending ? "Envoi…" : "Utiliser 1 Soleil"}</button>{message && <p role="status">{message}</p>}</form>;
}
