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
  registeredAddress: "rue du huit mai 1945 - 59130 Lambersart",
  publicEmail: "contact@reponseastrale.fr",
  publicPhone: "06 60 69 70 60",
  publicationDirector: "Vincent Vallet",
  hostingProviderName: "Netlify, Inc.",
  hostingProviderAddress: "101 2nd Street, San Francisco, CA 94105, États-Unis",
  hostingProviderContact: "support@netlify.com",
  mediatorName: null as string | null,
  mediatorAddress: null as string | null,
  mediatorWebsite: null as string | null,
  aiProvider: "Google Gemini API",
  cgvVersion: "2026-08-04",
  privacyVersion: "2026-08-05",
  executionConsentVersion: "2026-08-04",
} as const;

export const executionConsentText =
  "Je demande l’accès immédiat aux Soleils achetés avant la fin du délai légal de rétractation. Je reconnais que l’utilisation d’un Soleil pour soumettre une question déclenche l’exécution du service correspondant et peut affecter l’exercice de mon droit de rétractation dans les conditions prévues par la loi.";

export const legalCompletion = {
  registeredAddress: true,
  publicPhone: true,
  hostingProviderContact: true,
  consumerMediator: false,
} as const;

const mandatoryLiveFields: Array<string | null> = [
  legalConfig.registeredAddress,
  legalConfig.publicPhone,
  legalConfig.hostingProviderAddress,
  legalConfig.hostingProviderContact,
];

export function isLegalReadyForLivePayments() {
  return mandatoryLiveFields.every((value) => Boolean(value?.trim()))
    && legalCompletion.registeredAddress
    && legalCompletion.publicPhone
    && legalCompletion.hostingProviderContact;
}

export function isConsumerMediatorConfigured() {
  return legalCompletion.consumerMediator
    && [legalConfig.mediatorName, legalConfig.mediatorAddress, legalConfig.mediatorWebsite]
      .every((value) => Boolean(value?.trim()));
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
  processors: ["Netlify", "Neon", "WorkOS", "Stripe", "Google Gemini API"],
  internationalTransfers: "À documenter fournisseur par fournisseur avant production.",
};
