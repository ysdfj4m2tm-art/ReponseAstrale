import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("dépendances et secrets d’authentification", () => {
  it("ne conserve aucune dépendance Neon Auth ou Better Auth", () => {
    const manifest = readFileSync("package.json", "utf8");
    const lockfile = readFileSync("package-lock.json", "utf8");
    expect(manifest).not.toMatch(/@neondatabase\/(?:auth|auth-ui)|better-auth/);
    expect(lockfile).not.toMatch(/node_modules\/(?:@neondatabase\/auth(?:-ui)?|better-auth)"/);
  });

  it("ne contient pas de clé WorkOS ou Stripe exploitable dans les fichiers de configuration", () => {
    const files = [".env.example", "README.md", "docs/NETLIFY_DEPLOYMENT.md", "docs/NEON_SETUP.md"];
    const contents = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(contents).not.toMatch(/sk_(?:test|live)_[A-Za-z0-9]{20,}/);
    expect(contents).not.toMatch(/^WORKOS_API_KEY=[^\s#].+$/m);
    expect(contents).not.toMatch(/^WORKOS_COOKIE_PASSWORD=[^\s#].+$/m);
  });
});
