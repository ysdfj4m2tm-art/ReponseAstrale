import Link from "next/link";
import { AstralQuestionForm, type ExistingChartSummary } from "@/components/form/AstroForm";
import { questionCategories } from "@/content/questions";
import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

const statusLabels: Record<string,string> = {
  submitted: "Analyse en préparation",
  processing: "Analyse en cours",
  answered: "Réponse disponible",
  failed: "Traitement à reprendre",
  cancelled: "Annulée",
};
const categoryLabels = new Map(questionCategories.map((category) => [category.id, category.title]));

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const wasSubmitted = (await searchParams).submitted === "1";
  const profile = await ensureProfile(await requireAuthenticatedUser());
  const sql = getSqlClient();
  const [charts, questions, balanceRows] = await Promise.all([
    sql`SELECT id, first_name, birth_date, birth_time, birth_time_known, birth_place, birth_country
      FROM charts WHERE user_id = ${profile.id}::uuid ORDER BY created_at LIMIT 1`,
    sql`SELECT id, category, question_text, status, submitted_at FROM questions
      WHERE user_id = ${profile.id}::uuid ORDER BY submitted_at DESC LIMIT 50`,
    sql`SELECT COALESCE(sum(quantity_remaining) FILTER (
      WHERE status='active' AND quantity_remaining > 0 AND expires_at > now()
    ), 0)::int AS suns FROM sun_entitlements WHERE user_id = ${profile.id}::uuid`,
  ]);
  const suns = Number(balanceRows[0]?.suns ?? 0);
  const rawChart = charts[0];
  const chart: ExistingChartSummary | undefined = rawChart ? {
    id: String(rawChart.id), firstName: String(rawChart.first_name), birthDate: String(rawChart.birth_date),
    birthTime: rawChart.birth_time ? String(rawChart.birth_time) : null,
    birthTimeKnown: Boolean(rawChart.birth_time_known), birthPlace: String(rawChart.birth_place),
    birthCountry: rawChart.birth_country ? String(rawChart.birth_country) : null,
  } : undefined;

  return <div className="account-panel questions-panel">
    <div className="questions-heading"><div><span className="eyebrow">Questions personnelles</span><h2>Mes questions</h2><p>1 Soleil correspond à une question personnalisée.</p></div><div className="sun-balance"><strong>{suns}</strong><span>{suns === 1 ? "Soleil disponible" : "Soleils disponibles"}</span></div></div>
    {wasSubmitted&&<div className="submission-confirmation" role="status"><strong>Votre question a bien été transmise</strong><p>{chart?.firstName ? "Votre thème est en préparation. " : ""}Votre analyse personnalisée sera disponible sous 48 heures.</p><span>Analyse en préparation</span></div>}
    {suns > 0 ? <div className="account-form-frame"><AstralQuestionForm mode={chart ? "paid-existing-chart" : "paid-new-chart"} accountEmail={profile.email_normalized} chart={chart}/></div> : <div className="no-sun-state"><span className="eyebrow">Aucun Soleil disponible</span><h3>Choisissez un nouveau Soleil pour poser une question</h3><p>Chaque Soleil permet d’envoyer une question personnelle. La réponse est préparée sous 48 heures à partir de votre thème.</p><Link href="/exploration" className="button">Acheter des Soleils</Link></div>}
    <div className="record-list" aria-label="Historique des questions">{questions.map((question)=><article key={String(question.id)}><span className="record-status">{statusLabels[String(question.status)] || String(question.status)}</span><strong>{categoryLabels.get(String(question.category)) || String(question.category)}</strong><p>{String(question.question_text)}</p><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(question.submitted_at as string))}</small></article>)}</div>
  </div>;
}
