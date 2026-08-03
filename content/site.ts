export function resolveRuntimeConfig(env: Record<string, string | undefined>) {
  return {
    formEnabled: env.NEXT_PUBLIC_FORM_ENABLED !== "false",
    processingDelay: env.NEXT_PUBLIC_PROCESSING_DELAY || "24 à 48 heures",
    highDemand: env.NEXT_PUBLIC_HIGH_DEMAND === "true",
    highDemandMessage: env.NEXT_PUBLIC_HIGH_DEMAND_MESSAGE || "Nous recevons actuellement un nombre exceptionnel de demandes. Le délai de traitement peut être temporairement prolongé.",
  };
}

const runtimeConfig = resolveRuntimeConfig(process.env);
export const siteConfig = {
  name: "RéponseAstrale",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://reponseastrale.fr",
  email: "contact@reponseastrale.fr",
  slogan: "Posez votre question. Votre thème astral vous répond.",
  ...runtimeConfig,
  socialLinks: [] as { label: string; href: string }[],
};

export const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Questions possibles", href: "/questions-possibles" },
  { label: "Comment ça fonctionne", href: "/#fonctionnement" },
  { label: "Témoignages", href: "/temoignages" },
  { label: "Comprendre", href: "/comprendre" },
  { label: "FAQ", href: "/faq" },
];
