import type { AnalysisFormData } from "./form-schema";

export const NETLIFY_FIELDS = ["form-name", "dossierId", "submittedAt", "pageUrl", "referrer", "utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm", "formVersion", "category", "question", "birthDate", "birthTime", "birthTimeUnknown", "birthPlace", "birthCountry", "firstName", "email", "designation", "ageConfirmed", "consentData", "consentMarketing", "consentLimits", "partnerName", "partnerBirthDate", "partnerBirthTime", "partnerTimeUnknown", "partnerBirthPlace", "relationshipType", "thirdPartyConsent", "eventDate", "eventTime", "eventTimeUnknown", "eventPlace", "eventType", "eventDescription", "periodStart", "periodEnd", "periodPlace", "periodContext", "company-website"] as const;

export function serializeForNetlify(data: AnalysisFormData, technical: { dossierId: string; pageUrl: string; referrer: string; submittedAt?: string }) {
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const payload: Record<string, string> = {
    "form-name": "analyse-gratuite", dossierId: technical.dossierId, submittedAt: technical.submittedAt || new Date().toISOString(), pageUrl: technical.pageUrl, referrer: technical.referrer,
    utmSource: search.get("utm_source") || "", utmMedium: search.get("utm_medium") || "", utmCampaign: search.get("utm_campaign") || "", utmContent: search.get("utm_content") || "", utmTerm: search.get("utm_term") || "", formVersion: "1",
  };
  for (const [key, value] of Object.entries(data)) payload[key] = typeof value === "boolean" ? String(value) : value || "";
  return new URLSearchParams(payload).toString();
}

export function persistConfirmation(summary: unknown, storage?: Pick<Storage, "setItem">) {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.sessionStorage : undefined);
    target?.setItem("reponseastrale-confirmation", JSON.stringify(summary));
  } catch {
    // Some privacy-focused browsers disable sessionStorage. The submission must
    // still complete and redirect to the confirmation page in that case.
  }
}
