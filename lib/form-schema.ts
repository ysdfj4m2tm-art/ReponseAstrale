import { z } from "zod";

const optional = z.string().max(500).optional().or(z.literal(""));
const requiredDate = z.string().min(1, "Indiquez une date.");

export const formSchema = z.object({
  category: z.string().min(1, "Choisissez un sujet."),
  question: z.string().trim().min(20, "Décrivez votre question en au moins 20 caractères.").max(2000, "Votre question ne peut pas dépasser 2 000 caractères."),
  birthDate: requiredDate,
  birthTime: optional,
  birthTimeUnknown: z.boolean(),
  birthPlace: z.string().trim().min(2, "Indiquez votre ville et votre pays de naissance.").max(160),
  firstName: z.string().trim().min(2, "Indiquez votre prénom.").max(80),
  email: z.email("Indiquez une adresse e-mail valide."),
  designation: z.enum(["femme", "homme", "autre", "non-precise"]),
  ageConfirmed: z.literal(true, { error: "Vous devez confirmer être majeur." }),
  consentData: z.literal(true, { error: "Votre accord est nécessaire pour traiter la demande." }),
  consentMarketing: z.boolean(),
  consentLimits: z.literal(true, { error: "Vous devez accepter les limites de l’analyse." }),
  partnerName: optional,
  partnerBirthDate: optional,
  partnerBirthTime: optional,
  partnerTimeUnknown: z.boolean(),
  partnerBirthPlace: optional,
  relationshipType: optional,
  thirdPartyConsent: z.boolean(),
  eventDate: optional,
  eventTime: optional,
  eventTimeUnknown: z.boolean(),
  eventPlace: optional,
  eventType: optional,
  eventDescription: optional,
  periodStart: optional,
  periodEnd: optional,
  periodPlace: optional,
  periodContext: optional,
  "company-website": optional,
}).superRefine((data, ctx) => {
  const birth = new Date(`${data.birthDate}T12:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age--;
  if (!Number.isFinite(age) || age < 18) ctx.addIssue({ code: "custom", path: ["birthDate"], message: "RéponseAstrale est actuellement réservé aux personnes majeures." });
  if (!data.birthTimeUnknown && !data.birthTime) ctx.addIssue({ code: "custom", path: ["birthTime"], message: "Indiquez l’heure ou cochez « heure inconnue »." });
  if (data.category === "compatibilite") {
    if (!data.partnerBirthDate) ctx.addIssue({ code: "custom", path: ["partnerBirthDate"], message: "Indiquez la date de naissance de la seconde personne." });
    if (!data.partnerBirthPlace) ctx.addIssue({ code: "custom", path: ["partnerBirthPlace"], message: "Indiquez sa ville et son pays de naissance." });
    if (!data.relationshipType) ctx.addIssue({ code: "custom", path: ["relationshipType"], message: "Précisez la nature du lien." });
    if (!data.thirdPartyConsent) ctx.addIssue({ code: "custom", path: ["thirdPartyConsent"], message: "Cette confirmation est obligatoire." });
  }
  if (data.category === "date-importante" && (!data.eventDate || !data.eventType || !data.eventDescription)) ctx.addIssue({ code: "custom", path: ["eventDate"], message: "Complétez la date, le type et le contexte de l’événement." });
  if (["periode-passee", "periode-future"].includes(data.category) && (!data.periodStart || !data.periodContext)) ctx.addIssue({ code: "custom", path: ["periodStart"], message: "Complétez le début et le contexte de la période." });
});

export type AnalysisFormData = z.input<typeof formSchema>;

export const defaultFormValues: AnalysisFormData = {
  category: "", question: "", birthDate: "", birthTime: "", birthTimeUnknown: false, birthPlace: "", firstName: "", email: "", designation: "non-precise", ageConfirmed: false as never, consentData: false as never, consentMarketing: false, consentLimits: false as never,
  partnerName: "", partnerBirthDate: "", partnerBirthTime: "", partnerTimeUnknown: false, partnerBirthPlace: "", relationshipType: "", thirdPartyConsent: false,
  eventDate: "", eventTime: "", eventTimeUnknown: false, eventPlace: "", eventType: "", eventDescription: "", periodStart: "", periodEnd: "", periodPlace: "", periodContext: "", "company-website": "",
};
