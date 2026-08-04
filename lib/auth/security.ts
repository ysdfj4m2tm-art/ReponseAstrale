/**
 * Keep this false until an official @neondatabase/auth release no longer pins
 * an affected Better Auth version. Do not replace this with an environment
 * variable: a deployment setting must not be able to bypass the code review.
 */
export const NEON_AUTH_SDK_SECURITY_APPROVED = false;

export class AuthSecurityBlockedError extends Error {
  constructor() {
    super("Neon Auth est désactivé jusqu’à publication d’un SDK officiellement compatible et corrigé.");
    this.name = "AuthSecurityBlockedError";
  }
}

export function assertAuthSecurityApproved() {
  if (!NEON_AUTH_SDK_SECURITY_APPROVED) throw new AuthSecurityBlockedError();
}

export function safeInternalRedirect(value: string | null | undefined, fallback = "/espace") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return fallback;
  }
  try {
    const parsed = new URL(value, "https://reponseastrale.invalid");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function isAllowedReturnUrl(value: string, requestOrigin: string) {
  if (safeInternalRedirect(value, "") !== "") return true;
  try {
    const target = new URL(value);
    const configuredOrigin = new URL(process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://reponseastrale.fr").origin;
    return target.origin === requestOrigin || target.origin === configuredOrigin;
  } catch {
    return false;
  }
}

const returnKey = /callback|redirect|return/i;

function hasUnsafeReturnValue(value: unknown, requestOrigin: string, key = "") : boolean {
  if (typeof value === "string") return returnKey.test(key) && !isAllowedReturnUrl(value, requestOrigin);
  if (Array.isArray(value)) return value.some((item) => hasUnsafeReturnValue(item, requestOrigin, key));
  if (value && typeof value === "object") {
    return Object.entries(value).some(([childKey, child]) => hasUnsafeReturnValue(child, requestOrigin, childKey));
  }
  return false;
}

export async function hasUnsafeAuthReturnTarget(request: Request) {
  const url = new URL(request.url);
  for (const [key, value] of url.searchParams) {
    if (returnKey.test(key) && !isAllowedReturnUrl(value, url.origin)) return true;
  }
  if (request.method !== "POST") return false;
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      return hasUnsafeReturnValue(await request.clone().json(), url.origin);
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.clone().formData();
      for (const [key, value] of form) {
        if (typeof value === "string" && returnKey.test(key) && !isAllowedReturnUrl(value, url.origin)) return true;
      }
    }
  } catch {
    return true;
  }
  return false;
}
