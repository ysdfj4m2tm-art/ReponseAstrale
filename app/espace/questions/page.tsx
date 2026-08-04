import { QuestionForm } from "@/components/account/QuestionForm";
import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

export default async function QuestionsPage() {
  const profile = await ensureProfile(await requireAuthenticatedUser());
  const sql = getSqlClient();
  const charts = await sql`SELECT id, first_name, birth_date FROM charts WHERE user_id = ${profile.id}::uuid ORDER BY created_at`;
  const questions = await sql`SELECT id, question_text, status, submitted_at FROM questions WHERE user_id = ${profile.id}::uuid ORDER BY submitted_at DESC LIMIT 50`;
  return <div className="account-panel"><h2>Mes questions</h2><QuestionForm charts={charts.map((chart)=>({ id: String(chart.id), label: `${chart.first_name} · ${chart.birth_date}` }))}/><div className="record-list">{questions.map((question)=><article key={String(question.id)}><span className="record-status">{String(question.status)}</span><p>{String(question.question_text)}</p><small>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(question.submitted_at as string))}</small></article>)}</div></div>;
}
