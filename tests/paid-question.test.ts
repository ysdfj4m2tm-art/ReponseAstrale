import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { paidQuestionRequestSchema } from "@/lib/paid-question-schema";

const key = "11111111-1111-4111-8111-111111111111";

describe("question payante", () => {
  it("accepte une heure réellement inconnue et refuse une heure fictive", () => {
    const base = { mode: "paid-new-chart", firstName: "Camille", birthDate: "1990-05-05", birthPlace: "Lille", birthCountry: "France", category: "amour", questionText: "Une question personnelle suffisamment détaillée.", idempotencyKey: key } as const;
    expect(paidQuestionRequestSchema.safeParse({ ...base, birthTimeKnown: false, birthTime: null }).success).toBe(true);
    expect(paidQuestionRequestSchema.safeParse({ ...base, birthTimeKnown: false, birthTime: "12:00" }).success).toBe(false);
  });

  it("valide le mode thème existant et les catégories centralisées", () => {
    expect(paidQuestionRequestSchema.safeParse({ mode: "paid-existing-chart", chartId: key, category: "travail", questionText: "Une question personnelle suffisamment détaillée.", idempotencyKey: key }).success).toBe(true);
    expect(paidQuestionRequestSchema.safeParse({ mode: "paid-existing-chart", chartId: key, category: "categorie-inventee", questionText: "Une question personnelle suffisamment détaillée.", idempotencyKey: key }).success).toBe(false);
  });

  it("emploie le même composant partagé sur l’accueil et dans l’espace client", () => {
    expect(readFileSync("app/page.tsx", "utf8")).toMatch(/<AstralQuestionForm mode="free"/);
    expect(readFileSync("app/espace/questions/page.tsx", "utf8")).toMatch(/<AstralQuestionForm mode=\{chart \? "paid-existing-chart" : "paid-new-chart"\}/);
    expect(readFileSync("app/page.tsx", "utf8").indexOf("<AstralQuestionForm mode=\"free\"")).toBeLessThan(readFileSync("app/page.tsx", "utf8").indexOf("questions-section"));
  });

  it("conserve le flux gratuit Netlify et isole le flux payant", () => {
    const source = readFileSync("components/form/AstroForm.tsx", "utf8");
    expect(source).toMatch(/serializeForNetlify/);
    expect(source).toMatch(/data-netlify-honeypot/);
    expect(source).toMatch(/fetch\("\/api\/questions"/);
    expect(source).toMatch(/crypto\.randomUUID\(\)/);
  });
});
