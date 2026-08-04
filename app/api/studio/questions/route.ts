import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { authorizeStudio } from "@/lib/studio-auth";

export async function GET(request: Request) {
  const denied = authorizeStudio(request); if (denied) return denied;
  const status = new URL(request.url).searchParams.get("status") || "submitted";
  if (!(["submitted", "processing"] as const).includes(status as "submitted" | "processing")) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  const sql = getSqlClient();
  const rows = await sql`
    SELECT q.id, q.question_text, q.status, q.submitted_at,
      c.id AS chart_id, c.first_name, c.birth_date, c.birth_time, c.birth_time_known,
      c.birth_place, c.timezone, c.chart_data_json
    FROM questions q JOIN charts c ON c.id=q.chart_id
    WHERE q.status=${status}::question_status ORDER BY q.submitted_at LIMIT 50
  `;
  return NextResponse.json({ questions: rows });
}
