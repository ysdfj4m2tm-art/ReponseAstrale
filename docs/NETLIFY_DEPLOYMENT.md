# Netlify — Deploy Preview WorkOS / Neon / Stripe test

Le site Next.js 16 utilise `netlify.toml`, Node 22, les Route Handlers et `proxy.ts`. La seule base autorisée pour ce chantier est la branche Neon `codex-sales-funnel`.

## Variables Deploy Preview

Configurer côté serveur `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` et les variables Stripe test. Définir aussi `NEON_BRANCH=codex-sales-funnel` et `WORKOS_ENVIRONMENT=staging`. La convention officielle du SDK `@workos-inc/authkit-nextjs@4.3.1` reste `NEXT_PUBLIC_WORKOS_REDIRECT_URI`; elle doit correspondre exactement à l’URL de callback de la preview. Cette variable publique ne contient aucun secret.

Conserver `STRIPE_ENVIRONMENT=test` et `STRIPE_AUTOMATIC_TAX=false`. `APP_URL` doit être l’origine exacte de la preview. Ne jamais utiliser de clé Stripe live. `WORKOS_COOKIE_SAMESITE=lax` convient au retour AuthKit intersite ; le SDK impose HttpOnly et choisit Secure en HTTPS. Ne définir ni domaine de cookie partagé ni `SameSite=none` pour ce parcours.

Dans WorkOS Staging, vérifier :

- redirect URI : `https://deploy-preview-1--reponseastrale.netlify.app/callback` ;
- Sign-in URL : `https://deploy-preview-1--reponseastrale.netlify.app/connexion` ;
- Logout URI par défaut : une URL interne autorisée de la même preview, par exemple sa page d’accueil ;
- Magic Auth activé ;
- application `reponseastrale.fr's Application`.

## Contrôles de preview

1. Ne promouvoir aucune migration vers Neon production.
2. Lancer lint, TypeScript, tests, tests DB, vérification DB, build, audit et `git diff --check`.
3. Ouvrir `/connexion`, effectuer réellement le code Magic Auth, puis contrôler `/callback`, `/espace` et le bouton `Déconnexion`.
4. Confirmer qu’une seconde visite à `/espace` après déconnexion ou expiration repart vers `/connexion`.
5. Faire un paiement Stripe test, rejouer le webhook et vérifier le rattachement uniquement avec le même e-mail WorkOS vérifié.
6. Inspecter les logs sans corps de requête, e-mail, code, jeton ni secret.
7. Vérifier `Cache-Control: no-store` sur `/espace/*`, le `noindex` de preview et l’absence de données d’un autre compte.

La réception réelle du code e-mail et le paiement de bout en bout ne sont validés qu’après un test navigateur réel. Un build réussi ne suffit pas.

## Production

Les variables Production sont configurées exclusivement dans le contexte **Production** de Netlify. Les valeurs Stripe test, WorkOS Staging et Neon `codex-sales-funnel` restent exclusivement dans **Deploy Previews**. La checklist juridique et `npm run preflight:production` doivent être validés avant toute fusion. La procédure complète est dans `docs/PRODUCTION_RUNBOOK.md`.
