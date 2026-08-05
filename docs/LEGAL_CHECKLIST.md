# Checklist juridique avant paiements réels

État actuel : **production commerciale bloquée**. Les textes constituent une base opérationnelle à faire relire, pas un avis juridique.

- [ ] Compléter l’adresse exacte du siège social.
- [ ] Ajouter un numéro de téléphone public.
- [ ] Désigner un médiateur de la consommation et ses coordonnées.
- [ ] Vérifier l’adresse et le téléphone officiels de Netlify.
- [ ] Faire relire les CGV, le consentement à l’exécution immédiate et le parcours de rétractation.
- [ ] Valider prix TTC, TVA et facturation avec le comptable.
- [ ] Fixer et documenter les durées de conservation par finalité.
- [ ] Finaliser Resend : contrat, domaine vérifié, expéditeur autorisé, clé Netlify et réception d’un e-mail réel.
- [ ] Valider WorkOS AuthKit en environnement de production : application, redirect URI, Sign-in URL, Logout URI, domaine et réception réelle d’un code Magic Auth.
- [ ] Valider Google Gemini API pour le Studio : projet, facturation, API/service, région, contrat, sécurité et transferts.
- [ ] Confirmer que le service Gemini payant retenu désactive tout partage facultatif des journaux pour l’amélioration des modèles.
- [ ] Tenir la liste des sous-traitants RGPD et accords associés (Netlify, Neon, WorkOS, Stripe, e-mail, IA).
- [ ] Définir le traitement des remboursements, litiges et demandes partiellement exécutées.
- [ ] Vérifier l’information CNIL/cookies et activer un consentement si de nouveaux traceurs l’exigent.

Le garde-fou `isLegalReadyForLivePayments()` refuse l’environnement Stripe live tant que les coordonnées marquées comme incomplètes ne sont pas remplacées.

La réserve sur la validation juridique reste interne : cette checklist et les textes doivent être relus par un professionnel avant l’ouverture commerciale définitive.
