import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { requireAuthenticatedUserForApi } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";
import { paidQuestionRequestSchema, type PaidQuestionErrorCode } from "@/lib/paid-question-schema";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { assessSensitiveContent } from "@/lib/sensitive-content";

function errorResponse(error: PaidQuestionErrorCode, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUserForApi();
  if (!user) return errorResponse("NO_SESSION", 401);

  const profile = await ensureProfile(user);
  const limit = checkRateLimit(requestRateLimitKey(request, `question:${profile.id}`), 5, 60_000);
  if (!limit.allowed) return errorResponse("RATE_LIMITED", 429);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }
  const parsed = paidQuestionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_REQUEST", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const body = parsed.data;
  if (assessSensitiveContent(body.questionText).shouldReformulate) {
    return errorResponse("SENSITIVE_CONTENT_REFORMULATE", 422);
  }

  try {
    const sql = getSqlClient();
    if (body.mode === "paid-existing-chart") {
      const charts = await sql`SELECT user_id FROM charts WHERE id = ${body.chartId}::uuid LIMIT 1`;
      if (!charts.length) return errorResponse("CHART_NOT_FOUND", 404);
      if (String(charts[0].user_id) !== profile.id) return errorResponse("CHART_FORBIDDEN", 403);
    }

    const rows = await sql`SELECT * FROM submit_paid_question(
      ${profile.id}::uuid,
      ${body.mode === "paid-existing-chart" ? body.chartId : null}::uuid,
      ${body.mode === "paid-new-chart" ? body.firstName : null},
      ${body.mode === "paid-new-chart" ? body.birthDate : null},
      ${body.mode === "paid-new-chart" ? body.birthTime : null},
      ${body.mode === "paid-new-chart" ? body.birthTimeKnown : null}::boolean,
      ${body.mode === "paid-new-chart" ? body.birthPlace : null},
      ${body.mode === "paid-new-chart" ? body.birthCountry : null},
      ${body.category},
      ${body.questionText},
      ${body.idempotencyKey}
    )`;
    const result = rows[0];
    return NextResponse.json({
      questionId: String(result.question_id),
      chartId: String(result.chart_id),
      remaining: Number(result.quantity_remaining),
      replayed: Boolean(result.replayed),
    }, { status: result.replayed ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("NO_ACTIVE_SUN")) return errorResponse("NO_ACTIVE_SUN", 409);
    if (message.includes("SUN_EXPIRED")) return errorResponse("SUN_EXPIRED", 409);
    if (message.includes("CHART_FORBIDDEN")) return errorResponse("CHART_FORBIDDEN", 403);
    if (message.includes("IDEMPOTENCY_CONFLICT")) return errorResponse("IDEMPOTENCY_CONFLICT", 409);
    return errorResponse("QUESTION_FAILED", 500);
  }
}
