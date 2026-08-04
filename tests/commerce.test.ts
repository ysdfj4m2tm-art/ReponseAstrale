import { describe, expect, it } from "vitest";
import { calculateExpiration, commerceProducts, getCommerceProduct, isQuestionSubmittedBeforeExpiration, obsoleteStripePriceIds, sunRule } from "@/content/commerce";
import { executionConsentText, isLegalReadyForLivePayments } from "@/content/legal";
import { validateCheckoutInput, validatePaidLine } from "@/lib/commerce/validation";

describe("catalogue Soleil", () => {
  it("publie les deux offres contractuelles", () => {
    expect(commerceProducts.one_sun).toMatchObject({ priceCents: 1990, sunCount: 1, validityDays: 7 });
    expect(commerceProducts.three_suns).toMatchObject({ priceCents: 4990, sunCount: 3, validityDays: 30 });
    expect(sunRule).toBe("1 Soleil permet de poser 1 question personnelle.");
  });
  it("calcule les expirations et conserve une question soumise à temps", () => {
    const paid = new Date("2026-08-04T12:00:00Z");
    expect(calculateExpiration(paid, 7).toISOString()).toBe("2026-08-11T12:00:00.000Z");
    expect(calculateExpiration(paid, 30).toISOString()).toBe("2026-09-03T12:00:00.000Z");
    expect(isQuestionSubmittedBeforeExpiration(new Date("2026-08-11T12:00:00Z"), calculateExpiration(paid, 7))).toBe(true);
  });
  it("rejette produits, consentements et prix altérés côté client", () => {
    expect(getCommerceProduct("invented")).toBeNull();
    expect(validateCheckoutInput({ productCode: "one_sun", email: "a@b.fr", acceptCgv: false, acceptExecution: true }).ok).toBe(false);
    expect(validatePaidLine(commerceProducts.one_sun, { priceId: "price_test", amountTotal: 590, currency: "eur" }, "price_test")).toBe(false);
  });
  it("rejette explicitement les anciens identifiants de prix", () => {
    for (const id of obsoleteStripePriceIds) expect(validatePaidLine(commerceProducts.one_sun, { priceId: id, amountTotal: 1990, currency: "eur" }, id)).toBe(false);
  });
});

describe("garde-fous juridiques", () => {
  it("bloque le live tant que les coordonnées obligatoires sont incomplètes", () => expect(isLegalReadyForLivePayments()).toBe(false));
  it("conserve le consentement explicite à l’exécution", () => expect(executionConsentText).toContain("accès immédiat"));
});
