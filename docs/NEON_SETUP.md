# Neon — configuration de RéponseAstrale

## Cible autorisée

- Projet existant : `reponseastrale` (`lingering-shadow-04594799`), PostgreSQL 18, région Frankfurt.
- Développement et Deploy Preview : branche `codex-sales-funnel` uniquement.
- Production : aucune migration, fusion ou modification sans validation distincte.

Le script `npm run db:migrate` accepte `codex-sales-funnel`. Il n’accepte `production` qu’avec `CONFIRM_PRODUCTION_MIGRATION=APPLY_VERSIONED_MIGRATIONS`, à définir uniquement après autorisation humaine explicite. Les tests d’intégration avec écritures restent interdits en Production.

## Connexions

- `DATABASE_URL` : connexion pooled pour l’application Netlify serverless.
- `DATABASE_URL_UNPOOLED` : connexion directe réservée aux migrations, tests d’intégration et diagnostics.

Les profils conservent l’identité WorkOS dans `profiles.auth_user_id`. L’e-mail est normalisé côté serveur et les commandes payées non rattachées sont réclamées uniquement après réception d’un utilisateur WorkOS dont `emailVerified` vaut strictement `true`. Toutes les lectures de l’espace filtrent ensuite par l’UUID du profil ; un utilisateur ne peut donc pas lire les achats, questions ou réponses d’un autre.

Le type et les contraintes existants de `profiles.auth_user_id` conviennent. La migration WorkOS ne nécessite aucune modification de table : ne pas créer de colonne parallèle et ne pas supprimer les données ou fonctions transactionnelles existantes.

## Migrations et vérification

1. Vérifier la branche Neon et la valeur explicite de `NEON_BRANCH`.
2. N’exécuter `npm run db:migrate` que si une nouvelle migration SQL est réellement présente.
3. Exécuter `npm run db:verify` puis `npm run test:db` ; ce dernier travaille dans une transaction annulée.
4. Avant toute promotion future, créer une branche de sauvegarde de production, inspecter le SQL et tester la restauration.

## Authentification

Neon Auth n’est plus utilisé par l’application. WorkOS AuthKit Staging gère l’identité, Magic Auth et les sessions ; Neon reste exclusivement le stockage métier. Les anciennes variables `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` et `NEON_AUTH_SECURITY_REVIEW` doivent être retirées de Netlify lorsqu’elles ne servent à aucun autre service.

La rotation d’un mot de passe PostgreSQL se fait dans Neon puis dans les seules variables Netlify concernées, sans afficher l’URL complète dans un ticket, commit ou log.
