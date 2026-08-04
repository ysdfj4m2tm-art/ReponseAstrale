export const retentionConfig = {
  abandonedForms: "30 jours maximum pour les formulaires abandonnés et jetons temporaires non utilisés.",
  freeRequests: "12 mois après la livraison ou la dernière activité pour une demande gratuite et son contenu.",
  accountContent: "Pendant l’activité du compte, puis 3 ans maximum après la dernière activité pour le compte, les thèmes, questions et réponses payantes.",
  securityLogs: "12 mois maximum pour les journaux techniques et de sécurité, sauf incident justifiant une durée plus longue.",
  support: "3 ans après la clôture d’une demande de support.",
  commercialRecords: "5 ans pour les preuves contractuelles et litiges ; 10 ans pour les factures et pièces comptables.",
  accessTokens: "Supprimés ou rendus inutilisables à expiration ou révocation.",
} as const;
