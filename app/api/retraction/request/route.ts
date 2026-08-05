import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { normalizeEmail } from "@/lib/env";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security";

export async function POST(request: Request) {
  if (!checkRateLimit(requestRateLimitKey(request, "retraction"), 4, 10 * 60_000).allowed) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }
  const body = await request.json() as { email?: string; reference?: string };
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email) || !body.reference || body.reference.length < 8 || body.reference.length > 200) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  const sql = getSqlClient();
  const orders = await sql`
    SELECT id FROM orders
    WHERE email_normalized = ${email}
      AND (${body.reference} = opaque_session_id::text OR ${body.reference} = stripe_checkout_session_id OR ${body.reference} = stripe_payment_intent_id)
    LIMIT 1
  `;
  if (orders.length) {
    const token = createOpaqueToken();
    await sql`
      INSERT INTO retraction_requests (order_id, email_normalized, status, verification_token_hash, verification_expires_at)
      VALUES (${orders[0].id}::uuid, ${email}, 'requested', ${hashOpaqueToken(token)}, now())
    `;
  }
  return NextResponse.json({ accepted: true }, { status: 202 });
}
