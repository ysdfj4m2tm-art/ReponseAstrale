import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

export default async function AnswersPage() {
  const profile = await ensureProfile(await requireAuthenticatedUser());
  const sql = getSqlClient();
  const answers = await sql`SELECT q.question_text, a.answer_text, a.pdf_url, a.created_at FROM answers a JOIN questions q ON q.id=a.question_id WHERE q.user_id=${profile.id}::uuid ORDER BY a.created_at DESC`;
  return <div className="account-panel"><h2>Mes réponses</h2>{answers.length === 0 ? <p>Vos réponses terminées apparaîtront ici.</p> : <div className="record-list">{answers.map((answer, index)=><article key={index}><h3>{String(answer.question_text)}</h3><p className="answer-text">{String(answer.answer_text)}</p>{answer.pdf_url && <a href={String(answer.pdf_url)}>Télécharger le PDF</a>}</article>)}</div>}</div>;
}
