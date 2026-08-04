export type SensitiveContentAssessment = { shouldReformulate: boolean };

// Deliberately conservative: this looks for likely credentials, official identifiers,
// documents or detailed third-party sensitive data, not ordinary discussion topics.
const highConfidencePatterns = [
  /(?:mot de passe|password|code secret|code pin)\s*(?:est|:|=)/i,
  /(?:numéro de sécurité sociale|n[°o]\s*de sécu|NIR)\s*(?:est|:|=)?\s*[12]\s*\d{2}(?:\s*\d{2}){4,}/i,
  /(?:carte bancaire|CB)\s*(?:est|:|=)?\s*(?:\d[ -]?){13,19}/i,
  /(?:pièce d.identité|carte d.identité|passeport|document judiciaire|dossier médical|compte rendu psychologique)\s*(?:joint|copi|photo|scan|numéro|n[°o]|:)/i,
  /(?:diagnostiqué|diagnostic)\s+[^.!?]{0,80}(?:nom complet|adresse|téléphone|e-mail|email)\s+(?:de|d['’])?(?:mon|ma|son|sa|notre)/i,
  /(?:sexualité|opinion politique|conviction religieuse|donnée biométrique)\s+[^.!?]{0,100}(?:de mon|de ma|de son|de sa|d['’]une autre)/i,
];

export function assessSensitiveContent(text: string): SensitiveContentAssessment {
  if ((process.env.SENSITIVE_CONTENT_GUARD || "block") === "off") return { shouldReformulate: false };
  return { shouldReformulate: highConfidencePatterns.some((pattern) => pattern.test(text)) };
}
