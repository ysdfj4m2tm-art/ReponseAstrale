# Neon — configuration de RéponseAstrale

## Cible autorisée

- Projet existant : `reponseastrale` (`lingering-shadow-04594799`), PostgreSQL 18, région Frankfurt.
- Développement : branche `codex-sales-funnel`. Les migrations de ce chantier ont été appliquées uniquement ici.
- Production : ne pas migrer, fusionner ou modifier sans validation distincte.

Le fichier local `.neon` sélectionne le projet et la branche et reste ignoré par Git. Le script `npm run db:migrate` refuse toute branche dont `NEON_BRANCH` n’est pas exactement `codex-sales-funnel`.

## Connexions et variables

- `DATABASE_URL` : connexion pooled pour l’application serverless.
- `DATABASE_URL_UNPOOLED` : connexion directe, réservée aux migrations et diagnostics.
- `NEON_AUTH_BASE_URL` : URL du service Neon Auth.
- `NEON_AUTH_COOKIE_SECRET` : secret aléatoire d’au moins 32 caractères, distinct par environnement.

Ne jamais afficher une URL de connexion complète ni stocker ces valeurs dans Git. `.env.local` est ignoré. Sur Netlify, saisir les variables dans l’interface et limiter leur portée au contexte requis.

## Migrations et sauvegardes

1. Vérifier `pwd`, le projet et `NEON_BRANCH`.
2. Exécuter `npm run db:migrate`, puis `npm run db:verify`.
3. Exécuter `npm run test:db` ; le test utilise une transaction annulée.
4. Avant toute promotion future, créer une branche de sauvegarde Neon de production, inspecter le SQL et tester une restauration.

Les migrations ne suppriment aucune table. La promotion de production n’est ni automatisée ni exécutée par ce dépôt.

## Neon Auth

Neon Auth est activé sur le projet. Le site monte `/api/auth/[...path]`, les écrans `/connexion/*` et protège `/espace/*` côté serveur. Le mode retenu est le code e-mail à usage unique. Configurer les domaines autorisés pour le domaine de preview puis `https://reponseastrale.fr`; retirer localhost de la configuration live si inutile. Vérifier la délivrabilité, l’expéditeur, les redirections et l’état `emailVerified` avant production.

Neon Auth assure lui-même la génération et la remise des codes. Pour la production, configurer dans la console Neon Auth, sur la branche concernée, un fournisseur SMTP personnalisé utilisant les identifiants SMTP Resend. Cette configuration est distincte de `RESEND_API_KEY`, utilisée côté serveur par l’application pour ses confirmations, notifications, réponses disponibles, accusés de réception et demandes relatives aux données. Si les deux usages sont activés, Resend doit donc être configuré à la fois dans Neon Auth (SMTP) et dans Netlify (API applicative), avec des secrets adaptés et jamais committés.

Ne pas considérer l’e-mail comme opérationnel avant vérification du domaine chez Resend, autorisation de l’expéditeur, configuration du secret approprié dans chaque service et réception d’un code Neon Auth ainsi que d’un e-mail transactionnel applicatif réels. Le serveur partagé Neon peut servir uniquement aux essais de développement lorsque disponible.

## Rotation

Pour un mot de passe PostgreSQL ou un secret Auth : générer une nouvelle valeur dans Neon, mettre à jour uniquement les variables Netlify concernées, valider sur une preview, puis révoquer l’ancienne valeur. Ne jamais copier la valeur dans un ticket, un commit ou des logs. Répéter séparément par environnement.
