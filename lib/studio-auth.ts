import { NextResponse } from "next/server";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { getBearerToken, safeTokenEquals } from "@/lib/security";

export function authorizeStudio(request: Request) {
  const limited = checkRateLimit(requestRateLimitKey(request, "studio"), 120, 60_000);
  if (!limited.allowed) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  if (!safeTokenEquals(getBearerToken(request), process.env.STUDIO_API_TOKEN)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return null;
}
