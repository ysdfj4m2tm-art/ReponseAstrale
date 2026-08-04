# Revue de sécurité Neon Auth — 2026-08-04

## Décision

L’authentification publique reste désactivée. Au jour de la revue, les dernières versions officielles `@neondatabase/auth@0.4.2-beta` et `@neondatabase/auth-ui@0.2.1-beta` imposent exactement `better-auth@1.4.18`. Cette version est affectée par plusieurs avis 2026, dont la prise de contrôle de compte précréé sur le flux Email OTP utilisé par RéponseAstrale (`GHSA-qq9h-g4jm-xgf3`, corrigé en Better Auth 1.6.22).

Il n’est pas sûr de forcer Better Auth 1.6.x avec `overrides`, car Neon ne déclare pas cette combinaison compatible. `NEON_AUTH_SDK_SECURITY_APPROVED` reste donc codé à `false`; une variable de déploiement ne peut pas contourner ce blocage. Le paiement Stripe live vérifie le même verrou.

## Avis critical et high non corrigeables par un SDK Neon compatible

Le chemin commun est `reponseastrale > @neondatabase/auth@0.4.2-beta > better-auth@1.4.18`; `@neondatabase/auth-ui@0.2.1-beta` et `@better-auth/passkey@1.4.18` réutilisent la même version. Les versions corrigées ci-dessous sont celles de Better Auth, mais elles ne peuvent pas être substituées au verrouillage exact du SDK Neon sans combinaison non supportée.

| Avis | Sévérité | Fonction vulnérable | Première version corrigée | Usage et mitigation |
|---|---|---|---|---|
| GHSA-pw9m-5jxm-xr6h / CVE-2026-53512 | Critical | Refresh token OIDC/MCP sans authentification client | 1.6.11 | OIDC/MCP non configurés ; Auth entièrement bloquée. |
| GHSA-9h47-pqcx-hjr4 | High | `alg=none` et PKCE `plain` dans `oidcProvider` | 1.6.11 | Plugin non configuré ; Auth entièrement bloquée. |
| GHSA-86j7-9j95-vpqj | High | XSS stockée par `javascript:` dans `redirect_uri` OIDC/MCP | 1.6.13 | Plugin non configuré ; validation applicative des retours et Auth bloquée. |
| GHSA-7w99-5wm4-3g79 / CVE-2026-53518 | High | Double consommation concurrente d’un code OAuth | 1.6.11 | OAuth désactivé sur la branche de développement ; Auth bloquée. |
| GHSA-392p-2q2v-4372 / CVE-2026-53517 | High | Fork concurrent d’une famille de refresh tokens OAuth | 1.6.0 | OAuth désactivé sur la branche de développement ; Auth bloquée. |
| GHSA-g38m-r43w-p2q7 / CVE-2026-53516 | High | Auto-link OAuth vers un e-mail précréé non vérifié | 1.6.11 | OAuth désactivé sur la branche de développement ; Auth bloquée. |
| GHSA-fmh4-wcc4-5jm3 / CVE-2026-53514 | High | Invitation Organization acceptée avec e-mail non vérifié | 1.6.11 | Plugin Organization désactivé sur la branche de développement ; Auth bloquée. |
| GHSA-qq9h-g4jm-xgf3 | High | Prise de contrôle par compte précréé avec OTP/magic-link et inscription par mot de passe | 1.6.22 | Le flux projeté était vulnérable ; email/password, inscription et OTP sont désactivés, et Auth est bloquée. |

## Mesures appliquées

- Auth API renvoie 503 avant d’instancier le SDK vulnérable.
- OAuth Google partagé et plugin Organization désactivés sur `codex-sales-funnel` car inutiles.
- URLs de callback/retour limitées à des chemins internes ou à l’origine attendue.
- Navigation client normalisée vers un chemin interne.
- Cookies de cache explicitement `SameSite=Strict`, TTL ramené à 120 secondes ; le SDK impose aussi `HttpOnly` et `Secure`.
- Rate limit applicatif ajouté aux POST OTP/sign-in/sign-up, en complément du rate limit Neon.
- Un profil commercial et ses achats ne sont rattachés qu’après `emailVerified === true`.
- Aucun message applicatif ne révèle l’existence d’un compte pendant le blocage.

## Conditions de réactivation

1. Neon doit publier une version officielle compatible Next.js 16 qui ne dépend plus d’une version affectée de Better Auth.
2. Mettre à jour sans override, relancer les audits et vérifier l’arbre réel.
3. Tester la précréation d’un compte avec l’e-mail d’une victime, puis le flux OTP du propriétaire.
4. Configurer `require_email_verification`, un SMTP dédié, les domaines de confiance exacts et désactiver localhost avant production.
5. Tester cookies, expiration/révocation de session, callbacks, rate limits et réponses anti-énumération.
6. Après revue humaine, modifier explicitement `NEON_AUTH_SDK_SECURITY_APPROVED` dans le code.

La branche Neon production n’a pas été modifiée.
