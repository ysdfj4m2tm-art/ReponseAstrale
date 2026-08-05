import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { questionCategories } from "@/content/questions";

describe("Contenus demandés", () => {
  it("affiche le nouveau hero, la roue et le retour depuis l’achat", () => {
    const home = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
    const exploration = readFileSync(join(process.cwd(), "app", "exploration", "page.tsx"), "utf8");
    expect(home).toContain("Interrogez votre <em>thème astral</em>");
    expect(home).toContain("<div className=\"hero-wheel\"><AstroWheel/>");
    expect(home).toContain('<AstralQuestionForm mode="free"/>');
    expect(exploration).toContain("← Retour à mon espace");
    expect(exploration).toMatch(/user\?\.emailVerified/);
  });

  it("conserve les intitulés des cartes de questions", () => {
    const byId = Object.fromEntries(questionCategories.map((item) => [item.id, item]));
    expect(byId.couple.examples[0]).toBe("Quelles sont les forces/fragilités de ma relation actuelle ?");
    expect(byId.rencontre.examples[0]).toBe("Vais-je faire une belle rencontre prochainement ?");
    expect(byId.compatibilite.examples[0]).toBe("Quelles dynamiques principales existent entre deux thèmes ?");
    expect(byId.argent.examples[0]).toBe("Quelles dynamiques influencent ma relation à l’argent ?");
    expect(byId["date-importante"].shortTitle).toBe("Date");
    expect(byId["date-importante"].examples[0]).toBe("Quelles tendances entourent cette date précise ?");
    expect(byId.entrepreneuriat.examples[0]).toBe("Comment mener à bien mon projet professionnel");
  });

  it("ne réaffiche plus le bandeau de vigilance des mentions légales", () => {
    const page = readFileSync(join(process.cwd(), "app", "mentions-legales", "page.tsx"), "utf8");
    expect(page).not.toContain("À compléter avant exploitation commerciale définitive");
    expect(page).not.toContain("legal-warning");
  });
});
