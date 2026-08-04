import { afterEach, describe, expect, it } from "vitest";
import { assessSensitiveContent } from "@/lib/sensitive-content";

describe("contrôle prudent des contenus sensibles", () => {
  afterEach(() => { delete process.env.SENSITIVE_CONTENT_GUARD; });

  it("ne bloque pas les thèmes ordinaires de santé, d’argent ou de justice", () => {
    expect(assessSensitiveContent("Je traverse une période de santé difficile et je m'interroge sur mes finances.").shouldReformulate).toBe(false);
    expect(assessSensitiveContent("Comment vivre symboliquement une procédure de justice ?").shouldReformulate).toBe(false);
  });

  it("demande une reformulation pour un secret ou document vraisemblable", () => {
    expect(assessSensitiveContent("Mon mot de passe est : soleil123, que dois-je faire ensuite ?").shouldReformulate).toBe(true);
    expect(assessSensitiveContent("Voici le scan de mon dossier médical joint : pouvez-vous le lire ?").shouldReformulate).toBe(true);
  });

  it("peut être désactivé pour une revue administrative contrôlée", () => {
    process.env.SENSITIVE_CONTENT_GUARD = "off";
    expect(assessSensitiveContent("Mon mot de passe est : soleil123").shouldReformulate).toBe(false);
  });
});
