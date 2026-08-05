import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasValidWorkOSCallbackParameters } from "@/lib/auth/callback";
import { safeInternalRedirect } from "@/lib/auth/redirects";

const authMocks = vi.hoisted(() => ({
  withAuth: vi.fn(),
  getSignInUrl: vi.fn(),
  signOut: vi.fn(),
}));
const navigationMocks = vi.hoisted(() => ({ redirect: vi.fn((target: string) => { throw new Error(`REDIRECT:${target}`); }) }));
const databaseMocks = vi.hoisted(() => ({ sql: vi.fn(), getSqlClient: vi.fn() }));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  withAuth: authMocks.withAuth,
  getSignInUrl: authMocks.getSignInUrl,
  signOut: authMocks.signOut,
}));
vi.mock("next/navigation", () => navigationMocks);
vi.mock("@/db/client", () => ({ getSqlClient: databaseMocks.getSqlClient }));

import { getAuthenticatedUser, requireAuthenticatedUser } from "@/lib/auth/server";
import { ensureProfile } from "@/lib/profiles";

describe("sécurité WorkOS AuthKit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.getSqlClient.mockReturnValue(databaseMocks.sql);
  });

  it("redirige un utilisateur anonyme depuis l’espace", async () => {
    authMocks.withAuth.mockResolvedValue({ user: null });
    await expect(requireAuthenticatedUser()).rejects.toThrow("REDIRECT:/connexion");
  });

  it("autorise uniquement un utilisateur WorkOS à l’e-mail vérifié", async () => {
    authMocks.withAuth.mockResolvedValue({
      user: { id: "user_workos", email: "Personne@Example.test", emailVerified: true, firstName: "Ada" },
    });
    await expect(requireAuthenticatedUser()).resolves.toMatchObject({ id: "user_workos", emailVerified: true });
  });

  it("refuse une session expirée ou invalide", async () => {
    authMocks.withAuth.mockRejectedValue(new Error("expired session"));
    await expect(getAuthenticatedUser()).resolves.toBeNull();
    await expect(requireAuthenticatedUser()).rejects.toThrow("REDIRECT:/connexion");
  });

  it("n’autorise que des chemins de retour internes", () => {
    expect(safeInternalRedirect("/espace?source=auth")).toBe("/espace?source=auth");
    expect(safeInternalRedirect("https://evil.example/steal")).toBe("/espace");
    expect(safeInternalRedirect("//evil.example/steal")).toBe("/espace");
    expect(safeInternalRedirect("/\\evil.example")).toBe("/espace");
  });

  it("refuse un callback incomplet, dupliqué ou surdimensionné", () => {
    expect(hasValidWorkOSCallbackParameters(new Request("https://example.test/callback?code=x"))).toBe(false);
    expect(hasValidWorkOSCallbackParameters(new Request("https://example.test/callback?code=x&state=y&state=z"))).toBe(false);
    expect(hasValidWorkOSCallbackParameters(new Request(`https://example.test/callback?code=x&state=${"a".repeat(8_193)}`))).toBe(false);
    expect(hasValidWorkOSCallbackParameters(new Request("https://example.test/callback?code=x&state=y"))).toBe(true);
  });

  it("interdit tout profil et rattachement commercial avant vérification de l’e-mail", async () => {
    await expect(ensureProfile({ id: "user_test", email: "personne@example.test", emailVerified: false }))
      .rejects.toThrow("VERIFIED_EMAIL_REQUIRED");
    expect(databaseMocks.getSqlClient).not.toHaveBeenCalled();
  });

  it("retrouve le même profil sans en créer un second", async () => {
    const profile = { id: "profile-1", auth_user_id: "user_workos", email_normalized: "personne@example.test", first_name: null };
    databaseMocks.sql
      .mockResolvedValueOnce([profile]).mockResolvedValueOnce([])
      .mockResolvedValueOnce([profile]).mockResolvedValueOnce([]);
    const user = { id: "user_workos", email: " Personne@Example.test ", emailVerified: true };
    await expect(ensureProfile(user)).resolves.toEqual(profile);
    await expect(ensureProfile(user)).resolves.toEqual(profile);
    expect(databaseMocks.sql).toHaveBeenCalledTimes(4);
  });

  it("appelle la déconnexion du SDK", async () => {
    authMocks.signOut.mockResolvedValue(undefined);
    const { GET } = await import("@/app/deconnexion/route");
    await GET();
    expect(authMocks.signOut).toHaveBeenCalledOnce();
  });

  it("amorce la connexion depuis un Route Handler", async () => {
    authMocks.getSignInUrl.mockResolvedValue("https://authkit.example.test/authorize");
    const { GET } = await import("@/app/connexion/route");

    await expect(GET(new Request("https://example.test/connexion?returnTo=%2Fespace%2Fquestions")))
      .rejects.toThrow("REDIRECT:https://authkit.example.test/authorize");
    expect(authMocks.getSignInUrl).toHaveBeenCalledWith({ returnTo: "/espace/questions" });
  });
});
