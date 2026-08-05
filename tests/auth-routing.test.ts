import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

const proxySource = readFileSync("proxy.ts", "utf8");
const matcherBlock = proxySource.match(/matcher:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
const matcher = [...matcherBlock.matchAll(/["']([^"']+)["']/g)].map((match) => JSON.parse(`"${match[1]}"`) as string);
const matchesProxy = (url: string) => unstable_doesMiddlewareMatch({ config: { matcher }, url });

describe("routage WorkOS AuthKit", () => {
  it("utilise le proxy officiel AuthKit avec l'URI de callback de preview", () => {
    expect(proxySource).toMatch(/authkitProxy\(\{/);
    expect(proxySource).toMatch(/redirectUri:\s*process\.env\.NEXT_PUBLIC_WORKOS_REDIRECT_URI/);
  });

  it.each([
    "/",
    "/connexion",
    "/connexion/demarrer?returnTo=%2Fespace",
    "/callback?code=test&state=test",
    "/exploration",
    "/espace",
    "/espace/questions",
    "/api/questions",
    "/api/retraction/request",
  ])("couvre %s avec le proxy AuthKit", (url) => {
    expect(matchesProxy(url)).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image?url=%2Flogo.png",
    "/favicon.ico",
    "/images/hero.webp",
    "/fonts/site.woff2",
  ])("n'intercepte pas %s", (url) => {
    expect(matchesProxy(url)).toBe(false);
  });

  it("réserve la déconnexion à une Server Action explicite", () => {
    expect(existsSync("app/connexion/page.tsx")).toBe(true);
    expect(readFileSync("app/connexion/demarrer/route.ts", "utf8")).toMatch(/export async function GET/);
    expect(existsSync("app/deconnexion/route.ts")).toBe(false);
    expect(readFileSync("app/callback/route.ts", "utf8")).toMatch(/handleAuth/);

    const accountNav = readFileSync("components/account/AccountNav.tsx", "utf8");
    const logoutAction = readFileSync("components/account/actions.ts", "utf8");
    expect(accountNav).toMatch(/<form action=\{logout\}>/);
    expect(accountNav).not.toMatch(/href=["']\/deconnexion|router\.(push|replace)\(["']\/deconnexion|fetch\(["']\/deconnexion/);
    expect(logoutAction).toMatch(/^["']use server["'];/);
    expect(logoutAction).toMatch(/signOut\(\{[\s\S]*returnTo:\s*process\.env\.APP_URL/);
  });

  it("ne modifie aucun cookie et n'amorce aucun flux AuthKit depuis un Server Component", () => {
    const serverComponents = [
      "app/layout.tsx",
      "app/espace/layout.tsx",
      "app/espace/page.tsx",
      "app/espace/achats/page.tsx",
      "app/espace/donnees/page.tsx",
      "app/espace/questions/page.tsx",
      "app/espace/reponses/page.tsx",
    ].map((file) => readFileSync(file, "utf8")).join("\n");

    expect(serverComponents).not.toMatch(/getSignInUrl|getSignUpUrl|signOut|handleAuth|cookies\s*\(/);
  });

  it("limite withAuth aux consommateurs couverts par le proxy", () => {
    expect(readFileSync("lib/auth/server.ts", "utf8")).toMatch(/withAuth\(\)/);
    expect(readFileSync("components/layout/Header.tsx", "utf8")).toMatch(/getAuthenticatedUser/);

    const consumers = [
      "app/espace/layout.tsx",
      "app/espace/page.tsx",
      "app/espace/achats/page.tsx",
      "app/espace/donnees/page.tsx",
      "app/espace/questions/page.tsx",
      "app/espace/reponses/page.tsx",
      "app/api/questions/route.ts",
    ];
    for (const file of consumers) {
      expect(readFileSync(file, "utf8"), file).toMatch(/requireAuthenticatedUser/);
    }
  });
});
