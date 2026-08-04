import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function safeTokenEquals(actual: string | null, expected: string | undefined) {
  if (!actual || !expected) return false;
  const left = createHash("sha256").update(actual).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export function redactError(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: "Une erreur serveur est survenue." };
  return { name: "UnknownError", message: "Une erreur serveur est survenue." };
}
