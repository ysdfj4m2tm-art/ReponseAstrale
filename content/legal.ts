export const legalInfo = {
  site: "RéponseAstrale",
  domain: "reponseastrale.fr",
  publisher: "OFID",
  publicationDirector: "Vincent Vallet",
  location: "Métropole lilloise, Hauts-de-France",
  email: "contact@reponseastrale.fr",
  host: "Netlify",
  registrar: "OVH",
  // TODO LEGAL: compléter et vérifier les champs suivants avant exploitation commerciale définitive.
  legalForm: null as string | null,
  registeredAddress: null as string | null,
  registrationNumber: null as string | null,
  shareCapital: null as string | null,
  vatNumber: null as string | null,
  phone: null as string | null,
  hostAddress: null as string | null,
  processors: [] as string[],
  internationalTransfers: null as string | null,
};

if (process.env.NODE_ENV === "development") {
  const missing = Object.entries(legalInfo).filter(([, value]) => value === null).map(([key]) => key);
  if (missing.length) console.warn(`[TODO LEGAL] Champs à compléter : ${missing.join(", ")}`);
}
