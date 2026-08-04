export const legalConfig = {
  brandName: "RéponseAstrale",
  companyName: "OFID",
  legalForm: "SASU, société par actions simplifiée unipersonnelle",
  shareCapital: "1 000,00 €",
  siren: "939 818 126",
  siret: "939 818 126 00012",
  vatNumber: "FR10939818126",
  rcs: "939 818 126 R.C.S. Lille Métropole",
  rneStatus: "Inscrit",
  rcsRegistrationDate: "20 janvier 2025",
  publicLocation: "Métropole lilloise",
  registeredAddress: null as string | null,
  publicEmail: "contact@reponseastrale.fr",
  publicPhone: null as string | null,
  publicationDirector: "Vincent Vallet",
  hostingProviderName: "Netlify",
  hostingProviderAddress: null as string | null,
  hostingProviderPhone: null as string | null,
  mediatorName: null as string | null,
  mediatorAddress: null as string | null,
  mediatorWebsite: null as string | null,
  emailProvider: "Resend",
  aiProvider: "Google Gemini API",
  cgvVersion: "2026-08-04",
  privacyVersion: "2026-08-04",
  executionConsentVersion: "2026-08-04",
} as const;

export const executionConsentText =
  "Je demande l’accès immédiat aux Soleils achetés avant la fin du délai légal de rétractation. Je reconnais que l’utilisation d’un Soleil pour soumettre une question déclenche l’exécution du service correspondant et peut affecter l’exercice de mon droit de rétractation dans les conditions prévues par la loi.";

export const legalCompletion = {
  registeredAddress: false,
  publicPhone: false,
  hostingProviderContact: false,
  consumerMediator: false,
} as const;

const mandatoryLiveFields: Array<string | null> = [
  legalConfig.registeredAddress,
  legalConfig.publicPhone,
  legalConfig.hostingProviderAddress,
  legalConfig.hostingProviderPhone,
  legalConfig.mediatorName,
  legalConfig.mediatorAddress,
  legalConfig.mediatorWebsite,
];

export function isLegalReadyForLivePayments() {
  return mandatoryLiveFields.every((value) => Boolean(value?.trim()))
    && Object.values(legalCompletion).every(Boolean);
}

// Compatibility with the existing legal page while it is expanded.
export const legalInfo = {
  site: legalConfig.brandName,
  domain: "reponseastrale.fr",
  publisher: legalConfig.companyName,
  publicationDirector: legalConfig.publicationDirector,
  location: legalConfig.publicLocation,
  email: legalConfig.publicEmail,
  host: legalConfig.hostingProviderName,
  registrar: "OVH",
  legalForm: legalConfig.legalForm,
  registeredAddress: legalConfig.registeredAddress,
  registrationNumber: `${legalConfig.siren} / ${legalConfig.siret}`,
  shareCapital: legalConfig.shareCapital,
  vatNumber: legalConfig.vatNumber,
  phone: legalConfig.publicPhone,
  hostAddress: legalConfig.hostingProviderAddress,
  processors: ["Netlify", "Neon", "Stripe", "Resend", "Google Gemini API"],
  internationalTransfers: "À documenter fournisseur par fournisseur avant production.",
};
