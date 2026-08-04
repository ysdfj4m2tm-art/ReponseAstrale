import { describe, expect, it } from "vitest";
import {
  AuthSecurityBlockedError,
  assertAuthSecurityApproved,
  hasUnsafeAuthReturnTarget,
  NEON_AUTH_SDK_SECURITY_APPROVED,
  safeInternalRedirect,
} from "@/lib/auth/security";
import { ensureProfile } from "@/lib/profiles";

describe("garde-fous Neon Auth", () => {
  it("maintient le SDK Auth officiellement bloqué", () => {
    expect(NEON_AUTH_SDK_SECURITY_APPROVED).toBe(false);
    expect(() => assertAuthSecurityApproved()).toThrow(AuthSecurityBlockedError);
  });

  it("n’autorise que des redirections internes", () => {
    expect(safeInternalRedirect("/espace?source=auth")).toBe("/espace?source=auth");
    expect(safeInternalRedirect("https://evil.example/steal")).toBe("/espace");
    expect(safeInternalRedirect("//evil.example/steal")).toBe("/espace");
    expect(safeInternalRedirect("/\\evil.example")).toBe("/espace");
  });

  it("rejette les callbackURL externes dans query et JSON", async () => {
    expect(await hasUnsafeAuthReturnTarget(new Request("https://reponseastrale.fr/api/auth/callback?redirectTo=https://evil.example"))).toBe(true);
    expect(await hasUnsafeAuthReturnTarget(new Request("https://reponseastrale.fr/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callbackURL: "https://evil.example/callback" }),
    }))).toBe(true);
    expect(await hasUnsafeAuthReturnTarget(new Request("https://reponseastrale.fr/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callbackURL: "/espace" }),
    }))).toBe(false);
  });

  it("interdit tout rattachement commercial avant vérification de l’e-mail", async () => {
    await expect(ensureProfile({
      id: "user_test",
      email: "personne@example.test",
      emailVerified: false,
    })).rejects.toThrow("VERIFIED_EMAIL_REQUIRED");
  });
});
