# Remplacement de Neon Auth par WorkOS AuthKit — 2026-08-05

## Décision

Les SDK Neon Auth et leur dépendance Better Auth ont été supprimés. L’application utilise désormais `@workos-inc/authkit-nextjs` avec l’UI AuthKit hébergée et Magic Auth. Neon PostgreSQL demeure le stockage des profils et données métier ; aucune table métier n’a été supprimée ou recréée.

## Flux et garde-fous

- `/connexion` génère côté serveur l’URL AuthKit et n’accepte comme retour qu’un chemin interne validé.
- `/callback` utilise `handleAuth`, qui vérifie PKCE, nonce/état CSRF et code avec WorkOS. Les paramètres absents, dupliqués, vides ou excessifs sont refusés avant échange.
- Le callback n’appelle `ensureProfile` que si `user.emailVerified === true` ; aucun e-mail non vérifié ne peut déclencher le rattachement d’une commande.
- `profiles.auth_user_id` reçoit l’identifiant WorkOS. Un ancien profil au même e-mail vérifié est repris sans créer de doublon.
- `/espace/*` est dynamique, protégé côté serveur et renvoie `Cache-Control: private, no-store`. Chaque requête métier est filtrée par l’UUID du profil courant.
- Les sessions, rotations, cookies HttpOnly/Secure et la déconnexion sont gérés par AuthKit. `SameSite=lax` est conservé pour permettre le callback OAuth sécurisé.
- Les sessions absentes, invalides, révoquées ou expirées échouent en mode fermé et redirigent vers `/connexion`.
- Aucune API key WorkOS n’est exposée au navigateur et aucun OTP applicatif n’est généré ou journalisé.

La variable de callback effectivement lue par le SDK 4.3.1 est `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. Malgré son préfixe public, elle ne contient qu’une URL ; `WORKOS_API_KEY` et `WORKOS_COOKIE_PASSWORD` restent strictement serveur.

## Validation encore nécessaire

Le Deploy Preview doit être testé dans un navigateur avec une vraie boîte e-mail pour confirmer la réception du code, les cookies HTTPS, la déconnexion distante WorkOS et le parcours Stripe test. Cette revue de code ne vaut pas test de délivrabilité.
