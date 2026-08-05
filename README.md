# RéponseAstrale

> [!CAUTION]
> Avant toute exploitation commerciale, solder `docs/LEGAL_CHECKLIST.md`. Le code bloque l’environnement Stripe live tant que les coordonnées juridiques obligatoires restent incomplètes.

## Présentation

RéponseAstrale est le site public français d’analyse astrologique personnalisée. Il propose une première analyse offerte et un parcours payant fondé sur les « Soleils » : 1 Soleil permet de poser 1 question personnelle.

Le formulaire est relié à Netlify Forms par une soumission AJAX encodée en `application/x-www-form-urlencoded`. Le blueprint statique `public/netlify-form.html` permet à Netlify de détecter tous les champs au déploiement.

## Technologies

- Next.js 16 avec App Router ;
- React 19 et React DOM ;
- TypeScript en mode strict ;
- Tailwind CSS 4 et PostCSS ;
- React Hook Form, Zod et `@hookform/resolvers` ;
- Motion et Lucide React ;
- Neon PostgreSQL 18 et WorkOS AuthKit ;
- Drizzle ORM et migrations SQL contrôlées ;
- Stripe Checkout et webhook signé ;
- Resend prévu pour les e-mails transactionnels applicatifs ;
- Google Gemini API prévu pour l’interprétation et la rédaction, séparément du moteur astrologique déterministe ;
- ESLint, Vitest, Testing Library et jsdom pour les contrôles.

La liste faisant autorité reste celle de `package.json`. Le dépôt correspond désormais à une application Next.js standard destinée à Netlify.

## Installation locale

Prérequis : Node.js 22, npm et Git.

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

Pour tester le build de production :

```bash
npm run build
npm start
```

## Arborescence

```text
app/                     routes App Router, métadonnées, sitemap et robots
components/              navigation, footer, formulaire, modale et composants visuels
content/                 contenus éditoriaux, catégories, FAQ, témoignages et données légales
db/                      schéma Drizzle et migrations PostgreSQL
lib/                     services serveur, sécurité, commerce et analytics neutre
docs/                    procédures Neon, Stripe, Netlify, Studio et juridique
public/brand/            logo, favicons et icônes de marque
public/netlify-form.html blueprint statique de Netlify Forms
tests/                   tests de validation, composants, contenus et parité des champs
next.config.ts           configuration Next.js
netlify.toml             commande de build, Node 22 et en-têtes de sécurité
```

## Déploiement GitHub

1. Créer un dépôt vide sur GitHub, sans README généré automatiquement.
2. Dans le dossier du projet, initialiser Git si nécessaire : `git init`.
3. Ajouter les fichiers : `git add .`.
4. Créer le commit : `git commit -m "Initialise ReponseAstrale"`.
5. Ajouter le dépôt distant : `git remote add origin URL_DU_DEPOT_GITHUB`.
6. Pousser la branche principale : `git branch -M main`, puis `git push -u origin main`.

Remplacer `URL_DU_DEPOT_GITHUB` par l’URL réellement fournie par GitHub.

## Déploiement Netlify

1. Dans Netlify, choisir **Add new site → Import an existing project**, connecter GitHub et sélectionner le dépôt.
2. Vérifier que le framework détecté est **Next.js**.
3. Conserver `npm run build` comme commande de build. Ne pas saisir de répertoire de publication personnalisé : l’adaptateur Next.js gère la sortie.
4. Vérifier que la version de Node est 22, déjà déclarée dans `package.json` et `netlify.toml`.
5. Ajouter les variables d’environnement décrites ci-dessous.
6. Déclencher le déploiement.
7. Lire les journaux et vérifier la détection Next.js, l’installation de l’adaptateur OpenNext actuel, les routes et les formulaires.

Netlify prend en charge l’App Router sans configuration spéciale. Ne pas épingler un ancien `@netlify/plugin-nextjs` et ne pas ajouter de redirection globale qui court-circuite l’adaptateur.

## Netlify Forms

`public/netlify-form.html` est une page statique cachée. Elle contient le formulaire `analyse-gratuite`, son honeypot `company-website`, le champ `form-name` et tous les champs envoyés par React. Cette extraction statique est nécessaire pour que Netlify reconnaisse un formulaire piloté par JavaScript.

Après le premier déploiement :

1. Ouvrir **Forms** dans Netlify et activer la détection des formulaires si elle n’est pas déjà active.
2. Redéployer, puis vérifier que `analyse-gratuite` apparaît.
3. Effectuer une soumission réelle depuis le site en production et confirmer l’arrivée sur `/merci` seulement après succès.
4. Consulter les demandes dans **Forms** ; utiliser les actions du tableau de bord pour les exporter, les supprimer ou les marquer comme spam.
5. Dans les notifications du formulaire, ajouter une notification e-mail vers `contact@reponseastrale.fr`, puis faire un nouvel essai.

En cas de spam, activer ultérieurement la protection anti-spam visible recommandée par Netlify. Le honeypot reste actif entre-temps. Après toute modification de champ, mettre à jour `lib/form-schema.ts`, `components/form/AstroForm.tsx`, `lib/form-submit.ts` et `public/netlify-form.html`, puis lancer `npm run test:netlify-fields`.

Le formulaire empêche le renvoi pendant une soumission, affiche une erreur réseau, encode les valeurs, puis redirige vers `/merci` après une réponse HTTP réussie. Le module d’analytics ne reçoit aucune donnée personnelle.

## Domaine OVH

1. Ajouter `reponseastrale.fr` comme domaine personnalisé dans Netlify.
2. Relever dans Netlify les DNS exacts demandés pour ce site.
3. Reporter ces valeurs dans la zone DNS OVH sans inventer d’adresse IP ni de CNAME.
4. Ajouter `www.reponseastrale.fr` et choisir le domaine principal afin que Netlify configure la redirection de `www`.
5. Attendre la propagation, puis vérifier le certificat HTTPS et tester les deux adresses.

## Variables d’environnement

Copier `.env.example` vers `.env.local` en local et déclarer les mêmes variables dans Netlify :

| Variable | Utilisation |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canonique du site |
| `NEXT_PUBLIC_FORM_ENABLED` | activation ou suspension du formulaire |
| `NEXT_PUBLIC_PROCESSING_DELAY` | délai affiché |
| `NEXT_PUBLIC_HIGH_DEMAND` | affichage de l’alerte de forte demande |
| `NEXT_PUBLIC_HIGH_DEMAND_MESSAGE` | texte de cette alerte |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | emplacement réservé, valeur actuelle `none` |
| `GEOCODING_PROVIDER` | emplacement réservé, valeur actuelle `none` |
| `GEOCODING_API_KEY` | clé privée éventuelle d’un futur géocodage |
| `DATABASE_URL` | connexion Neon pooled de l’application |
| `DATABASE_URL_UNPOOLED` | connexion directe réservée aux migrations |
| `WORKOS_CLIENT_ID` | identifiant public de l’application WorkOS Staging |
| `WORKOS_API_KEY` | clé WorkOS strictement serveur |
| `WORKOS_COOKIE_PASSWORD` | chiffrement serveur de la session AuthKit, 32 caractères minimum |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | callback exact enregistré dans WorkOS (`/callback`) |
| `WORKOS_COOKIE_SAMESITE` | politique du cookie SDK, valeur recommandée `lax` pour le retour OAuth |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | API et signature Stripe côté serveur |
| `STRIPE_PRICE_ONE_SUN` / `STRIPE_PRICE_THREE_SUNS` | catalogue Stripe test/live |
| `STUDIO_API_TOKEN` | authentification serveur de la passerelle Studio |
| `EMAIL_PROVIDER` / `EMAIL_FROM` | fournisseur Resend et expéditeur transactionnel |
| `RESEND_API_KEY` | clé Resend serveur pour les e-mails de l’application |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | accès serveur au service Gemini retenu |
| `SENSITIVE_CONTENT_GUARD` | contrôle prudent avant stockage/envoi, valeur recommandée `block` |

Ne jamais placer de secret dans une variable préfixée `NEXT_PUBLIC_`. `NEXT_PUBLIC_WORKOS_REDIRECT_URI` est une URL publique, pas une clé. AuthKit hébergé génère, envoie et vérifie lui-même les codes Magic Auth. L’envoi Resend applicatif n’est pas considéré opérationnel avant vérification du domaine, autorisation de l’expéditeur, configuration de la clé et réception d’un e-mail réel.

## Suspension du formulaire

Dans Netlify, définir :

```env
NEXT_PUBLIC_FORM_ENABLED=false
```

Enregistrer, déclencher un nouveau déploiement et vérifier que le message de suspension remplace le formulaire.

## Forte demande

Conserver `NEXT_PUBLIC_FORM_ENABLED=true`, passer `NEXT_PUBLIC_HIGH_DEMAND=true`, modifier `NEXT_PUBLIC_PROCESSING_DELAY` et `NEXT_PUBLIC_HIGH_DEMAND_MESSAGE`, puis redéployer. Aucun changement de code n’est nécessaire.

## Modification des contenus

- landing page : `app/page.tsx` ;
- catégories et questions : `content/questions.ts` ;
- FAQ : `content/faq.ts` ;
- témoignages : `content/testimonials.ts` ;
- exemple Vanya : `content/vanya-example.ts` ;
- pages SEO : `content/seo-pages.ts` ;
- données légales : `content/legal.ts` ;
- logo et icônes : `public/brand/` ;
- visuel social : `public/og.png` ;
- styles et responsive : `app/globals.css`.

## Mentions légales

Les champs juridiques incomplets restent centralisés dans `content/legal.ts`. Avant la mise en ligne commerciale, renseigner et valider la forme juridique, le siège, le SIREN/SIRET, le capital, la TVA, le téléphone, les coordonnées de l’hébergeur, le médiateur et les prestataires technologiques. L’adresse du siège reste volontairement absente des pages publiques tant qu’elle n’est pas stabilisée ; cette absence ne vaut pas résolution juridique.

## Netlify Web Analytics

Netlify Web Analytics peut être activé depuis **Analytics** dans le tableau de bord. Il mesure le trafic global sans nécessiter l’ajout d’un script au site, mais ne fournit pas à lui seul le détail de chaque étape du formulaire. Toute future solution d’événements doit exclure prénom, e-mail, naissance, lieu, question et numéro de dossier complet, puis être documentée dans la politique de confidentialité.

## Lighthouse

1. Lancer `npm run build`, puis `npm start`, ou utiliser le déploiement Netlify de production.
2. Ouvrir le site dans Chrome puis **DevTools → Lighthouse**.
3. Choisir le mode **Mobile**.
4. Vérifier **Performance**, **Accessibilité**, **Bonnes pratiques** et **SEO**, lancer l’analyse et corriger les régressions avant publication.

## Parcours commercial

Le code fournit le catalogue 1/3 Soleils, Stripe Checkout, un webhook idempotent, les droits transactionnels, WorkOS Magic Auth par code e-mail, l’espace client et la passerelle Studio. Le PDF reste produit par le Studio. Les ressources Stripe test, WorkOS Staging, l’expéditeur e-mail applicatif et les variables Netlify doivent être configurés selon `docs/` avant un test bout en bout, puis la checklist juridique doit être soldée avant le live.
