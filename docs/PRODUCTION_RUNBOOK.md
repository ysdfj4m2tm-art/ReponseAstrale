# Mise en production de RéponseAstrale

Cette procédure est opérationnelle mais ne remplace pas une validation juridique ou comptable professionnelle. Aucun secret ne doit être copié dans Git, les logs, un ticket ou une conversation.

## Barrières obligatoires

- Production Git/Netlify : `main` uniquement.
- Deploy Preview : Stripe test, WorkOS Staging, Neon `codex-sales-funnel` uniquement.
- Production : Stripe Live, WorkOS Production, branche Neon `production` uniquement.
- Toute migration Production, tout push, toute fusion, tout paiement réel et tout remboursement exigent une autorisation humaine explicite distincte.

## Variables par contexte

Dans **Netlify → Site configuration → Environment variables**, utiliser les portées de déploiement et ne jamais partager une variable sensible entre Production et Deploy Previews.

| Variable | Deploy Previews | Production |
|---|---|---|
| `APP_URL` | origine exacte de la preview | `https://reponseastrale.fr` |
| `DATABASE_URL` | Neon `codex-sales-funnel`, pooled | Neon `production`, pooled |
| `DATABASE_URL_UNPOOLED` | Neon `codex-sales-funnel`, direct | Neon `production`, direct |
| `NEON_BRANCH` | `codex-sales-funnel` | `production` |
| `STRIPE_SECRET_KEY` | clé test | clé live |
| `STRIPE_WEBHOOK_SECRET` | endpoint test | endpoint live |
| `STRIPE_PRICE_ONE_SUN` | Price test 19,90 EUR | Price live 19,90 EUR |
| `STRIPE_PRICE_THREE_SUNS` | Price test 49,90 EUR | Price live 49,90 EUR |
| `STRIPE_ENVIRONMENT` | `test` | `live` |
| `STRIPE_AUTOMATIC_TAX` | `false` | `false` |
| `WORKOS_CLIENT_ID` | Staging | Production |
| `WORKOS_API_KEY` | Staging | Production |
| `WORKOS_COOKIE_PASSWORD` | secret Staging | nouveau secret Production, 32 caractères minimum |
| `WORKOS_ENVIRONMENT` | `staging` | `production` |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | callback exact de la preview | `https://reponseastrale.fr/callback` |

Ne pas définir `WORKOS_COOKIE_DOMAIN` sauf nécessité démontrée. En Production, seule une valeur `reponseastrale.fr` ou `.reponseastrale.fr` est acceptée par le garde-fou.

## Neon Production

Préconditions : branche cible confirmée, URLs pooled/direct issues de cette branche, point de restauration disponible, SQL versionné relu et autorisation humaine explicite obtenue.

Ordre des migrations : `0001` à `0007`, selon `app_migrations`. Le script calcule et vérifie le SHA-256 de chaque fichier ; une migration déjà appliquée mais modifiée provoque un arrêt.

Après autorisation seulement :

1. Créer une branche ou un point de restauration depuis la branche Production selon la rétention du plan Neon.
2. Injecter les variables Production dans le processus local sans les écrire dans le dépôt.
3. Définir `NEON_BRANCH=production` et `CONFIRM_PRODUCTION_MIGRATION=APPLY_VERSIONED_MIGRATIONS`.
4. Exécuter `npm run db:migrate`, puis retirer immédiatement la variable de confirmation.
5. Exécuter `npm run db:verify` et `npm run preflight:production`.
6. Ne jamais exécuter `npm run test:db` sur Production ; ce script le refuse.

Rollback : ne pas modifier ou supprimer une migration appliquée. En cas d’échec avant commit SQL, la transaction est annulée. Après commit, arrêter l’application et restaurer la branche/heure de sauvegarde Neon, puis analyser la migration avant toute nouvelle tentative.

## Stripe Live

Dans **Stripe Dashboard**, activer le mode Live et vérifier que les paiements et virements sont activés. Créer deux produits à paiement ponctuel, sans abonnement :

- `1 Soleil`, 19,90 EUR TTC, métadonnées `product_code=one_sun`, `sun_quantity=1`, `validity_days=7` ;
- `3 Soleils`, 49,90 EUR TTC, métadonnées `product_code=three_suns`, `sun_quantity=3`, `validity_days=30`.

Créer **Developers → Webhooks → Add endpoint** vers `https://reponseastrale.fr/api/stripe/webhook` avec les sept événements listés dans `docs/STRIPE_SETUP.md`. Placer le signing secret directement dans Netlify Production.

## WorkOS Production

Dans **WorkOS Dashboard**, sélectionner l’environnement **Production**, ajouter la facturation demandée, puis configurer l’application web RéponseAstrale :

- Redirect URI : `https://reponseastrale.fr/callback` ;
- Homepage : `https://reponseastrale.fr` ;
- Initiate login URI : `https://reponseastrale.fr/connexion` ;
- Logout URI : `https://reponseastrale.fr` ;
- Magic Auth activé ;
- branding Production copié puis vérifié ;
- durée maximale et expiration d’inactivité raisonnables.

Les clés, utilisateurs et réglages Staging ne sont pas transférés automatiquement vers Production.

## Contrôles avant fusion

```text
npm run lint
npm run typecheck
npm test
npm run test:db        # codex-sales-funnel uniquement
npm run db:verify      # branche explicitement déclarée
npm run build
npm audit --omit=dev
npm run preflight:production
git diff --check
```

Le préflight masque toutes les valeurs, vérifie les déclarations d’environnement, lit les deux Price Stripe, valide l’accès WorkOS et compare les migrations Neon. Il n’effectue aucun paiement et aucune écriture en base.

## Publication et premier paiement

Après autorisation de fusion et déploiement, vérifier le SHA de `main`, le déploiement Netlify, HTTPS, `/connexion`, `/callback`, `/espace`, `/api/stripe/webhook` et les pages juridiques. L’endpoint webhook répond normalement `400` sans signature ; cela confirme qu’il n’accepte pas d’appel non signé.

Le premier paiement réel de 19,90 EUR est effectué uniquement par l’utilisateur avec son compte, sa carte et l’adresse e-mail WorkOS correspondante. Vérifier dans Stripe et Neon : événement Live en 2xx, une seule commande, un seul Soleil, aucun abonnement et aucune écriture dans `codex-sales-funnel`. Tout remboursement ultérieur exige une nouvelle autorisation explicite.
