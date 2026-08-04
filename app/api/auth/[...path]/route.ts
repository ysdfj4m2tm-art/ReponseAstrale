import { getAuth } from "@/lib/auth/server";
import { AuthSecurityBlockedError, hasUnsafeAuthReturnTarget } from "@/lib/auth/security";
import { checkRateLimit, requestRateLimitKey } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function safelyHandle(request: Request, context: RouteContext, method: "GET" | "POST") {
  if (await hasUnsafeAuthReturnTarget(request)) {
    return NextResponse.json({ error: "INVALID_RETURN_URL" }, { status: 400 });
  }
  const { path } = await context.params;
  const sensitiveFlow = path.some((segment) => /otp|sign-in|sign-up|verification/i.test(segment));
  if (method === "POST" && sensitiveFlow && !checkRateLimit(requestRateLimitKey(request, "neon-auth-code"), 5, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "AUTH_REQUEST_LIMITED" }, { status: 429 });
  }
  try {
    return getAuth().handler()[method](request, context);
  } catch (error) {
    if (error instanceof AuthSecurityBlockedError) {
      return NextResponse.json({ error: "AUTH_TEMPORARILY_DISABLED" }, { status: 503 });
    }
    throw error;
  }
}

export async function GET(request: Request, context: RouteContext) {
  return safelyHandle(request, context, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  return safelyHandle(request, context, "POST");
}
