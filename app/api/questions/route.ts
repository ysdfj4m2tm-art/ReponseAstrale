import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { assessSensitiveContent } from "@/lib/sensitive-content";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  const profile = await ensureProfile(user);
  const limit = checkRateLimit(requestRateLimitKey(request, `question:${profile.id}`), 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  const body = await request.json() as { chartId?: string; questionText?: string };
  const key = request.headers.get("idempotency-key");
  if (!body.chartId || !uuid.test(body.chartId) || !key || key.length > 100 || typeof body.questionText !== "string" || body.questionText.trim().length < 20 || body.questionText.length > 2000) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (assessSensitiveContent(body.questionText).shouldReformulate) {
    return NextResponse.json({ error: "SENSITIVE_CONTENT_REFORMULATE" }, { status: 422 });
  }
  try {
    const sql = getSqlClient();
    const rows = await sql`SELECT * FROM consume_sun_for_question(${profile.id}::uuid, ${body.chartId}::uuid, ${body.questionText.trim()}, ${key})`;
    return NextResponse.json({ questionId: rows[0].question_id, remaining: rows[0].quantity_remaining }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = message.includes("NO_ACTIVE_SUN") ? "NO_ACTIVE_SUN" : message.includes("CHART_FORBIDDEN") ? "CHART_FORBIDDEN" : "QUESTION_FAILED";
    return NextResponse.json({ error: code }, { status: code === "CHART_FORBIDDEN" ? 403 : 409 });
  }
}
