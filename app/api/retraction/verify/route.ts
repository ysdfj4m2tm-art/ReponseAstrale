import { NextResponse } from "next/server";
import { getSqlClient } from "@/db/client";
import { getAppUrl } from "@/lib/env";
import { hashOpaqueToken } from "@/lib/security";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token.length < 32 || token.length > 256) return NextResponse.redirect(`${getAppUrl()}/retractation?verification=invalid`);
  const sql = getSqlClient();
  const updated = await sql`
    UPDATE retraction_requests SET status='under_review', verified_at=now()
    WHERE verification_token_hash=${hashOpaqueToken(token)} AND status='email_verification_pending' AND verification_expires_at > now()
    RETURNING id
  `;
  return NextResponse.redirect(`${getAppUrl()}/retractation?verification=${updated.length ? "ok" : "invalid"}`);
}
