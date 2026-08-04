import { createNeonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";
import { ConfigurationError, requireServerEnv } from "@/lib/env";
import { assertAuthSecurityApproved, AuthSecurityBlockedError } from "@/lib/auth/security";

let authInstance: ReturnType<typeof createNeonAuth> | undefined;

export function getAuth() {
  assertAuthSecurityApproved();
  if (!authInstance) {
    const { NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET } = requireServerEnv(
      "NEON_AUTH_BASE_URL",
      "NEON_AUTH_COOKIE_SECRET",
    );
    authInstance = createNeonAuth({
      baseUrl: NEON_AUTH_BASE_URL,
      cookies: {
        secret: NEON_AUTH_COOKIE_SECRET,
        sessionDataTtl: 120,
        sameSite: "strict",
      },
    });
  }
  return authInstance;
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { data } = await getAuth().getSession();
    const user = data?.user as Record<string, unknown> | undefined;
    if (!user || typeof user.id !== "string" || typeof user.email !== "string") return null;
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified === true,
      name: typeof user.name === "string" ? user.name : null,
    };
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof AuthSecurityBlockedError) return null;
    throw error;
  }
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/connexion/sign-in");
  if (!user.emailVerified) redirect("/connexion/verify-email");
  return user;
}
