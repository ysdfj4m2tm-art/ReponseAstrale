# Netlify — procédure de déploiement (non exécutée)

Le site public Next.js 16 utilise `netlify.toml`, Node 22 et les Route Handlers. Neon se trouve à Frankfurt ; choisir une région de fonctions européenne compatible dans le plan Netlify lorsque disponible et mesurer la latence.

## Variables

Reporter les variables de `.env.example` dans le contexte **Deploy Preview** sans les exposer au navigateur. Utiliser uniquement la branche Neon `codex-sales-funnel`, des données de test et les ressources Stripe test (`STRIPE_ENVIRONMENT=test`, `STRIPE_AUTOMATIC_TAX=false`). Le secret Studio doit être long, aléatoire et réservé aux fonctions serveur. Les valeurs de production doivent être distinctes.

La preview de rendu n’a besoin d’aucune clé Gemini ou Resend. Lorsque des tests d’intégration seront autorisés séparément, `RESEND_API_KEY`, `GEMINI_API_KEY` et `GEMINI_MODEL` resteront des variables serveur limitées au contexte Deploy Preview. Aucun de ces noms ne doit recevoir un préfixe `NEXT_PUBLIC_`.

## Preview

1. Ne pas promouvoir les migrations Neon vers production.
2. Configurer Auth, Stripe test, e-mail et Studio sur une preview.
3. Lancer lint, TypeScript, tests, build, paiement test, webhook répété, connexion e-mail et parcours mobile/desktop.
4. Inspecter les logs sans corps de requête, e-mail, jeton ou secret.
5. Vérifier la balise robots, l’en-tête `X-Robots-Tag: noindex, nofollow, noarchive` et le badge « Environnement de prévisualisation ».

Un Deploy Preview est partageable avec toute personne possédant son URL sauf protection Netlify complémentaire. Le `noindex` réduit l’indexation ; il ne rend pas l’URL privée.

## Vérification Gemini avant production

- confirmer le projet Google et la facturation ;
- identifier précisément l’API Gemini et le modèle employés ;
- valider la région et les conditions contractuelles ;
- désactiver toute journalisation ou tout partage facultatif destiné à l’amélioration des modèles ;
- vérifier les paramètres de sécurité et le contrôle configurable des contenus sensibles ;
- stocker la clé exclusivement dans Netlify et confirmer son absence du navigateur.

Le contrôle automatique est une aide prudente, pas une garantie infaillible. Une détection vraisemblable doit provoquer une demande de reformulation avant stockage. Toute revue administrative exceptionnelle passe par l’accès Studio authentifié et limité ; le texte intégral d’une question ne doit jamais être copié dans les logs ni dans les analytics.

La configuration de production doit utiliser un service payant adapté. Les conditions de traitement, journalisation et conservation dépendent du service Gemini choisi et de sa configuration ; aucune conservation absolument nulle ne doit être promise sans vérification contractuelle et technique du service retenu.

## Production

La mise en production est bloquée tant que `docs/LEGAL_CHECKLIST.md` n’est pas soldée. Une fois autorisée, utiliser le projet existant, créer une sauvegarde/branche de sécurité Neon, appliquer les migrations après revue, configurer les domaines Auth et webhook live, puis réaliser un contrôle post-déploiement. Aucun déploiement n’a été effectué dans ce chantier.

Le webhook Netlify doit conserver le corps brut et répondre rapidement. Surveiller les événements Stripe échoués, les logs de fonction, les erreurs Auth et les commandes restées `checkout_created`.
