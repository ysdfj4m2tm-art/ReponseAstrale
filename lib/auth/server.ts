import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { user } = await withAuth();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified === true,
      name: user.firstName,
    };
  } catch {
    // Missing, invalid, revoked and expired SDK sessions all fail closed.
    return null;
  }
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user || !user.emailVerified) redirect("/connexion");
  return user;
}
