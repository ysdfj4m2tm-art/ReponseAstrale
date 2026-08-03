# RéponseAstrale

> [!CAUTION]
> **MENTIONS LÉGALES — À compléter immédiatement avant l’exploitation commerciale définitive.**
>
> Renseigner et vérifier dans `content/legal.ts` : forme juridique d’OFID, adresse complète du siège, SIREN ou SIRET, capital social éventuel, numéro de TVA éventuel, téléphone professionnel éventuel et adresse officielle complète de Netlify. Ajouter aussi le nom précis des sous-traitants technologiques et les informations sur les transferts de données avant leur utilisation. Les commentaires `TODO LEGAL` repèrent ces éléments. Les textes présents ne sont pas présentés comme validés par un avocat.

RéponseAstrale est un site Next.js en français permettant à une personne majeure de demander sa première analyse astrologique personnalisée et de poser une question gratuitement. Le formulaire est conçu pour Netlify Forms, avec soumission AJAX, honeypot, numéro de dossier et page de confirmation.

## Installation locale

### Prérequis

- Node.js 22 ou version compatible avec `package.json` ;
- npm ;
- Git pour la mise en ligne sur GitHub.

### Démarrer

```bash
npm install
npm run dev
```

Ouvrir ensuite l’adresse locale affichée. Les commandes de contrôle sont :

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pour un audit Lighthouse, lancer le site puis ouvrir Chrome DevTools → Lighthouse. Sélectionner Mobile, cocher Performance, Accessibilité, Bonnes pratiques et SEO, puis lancer l’analyse. Refaire l’audit sur une version de production déployée pour un résultat représentatif.

## Déploiement GitHub → Netlify

1. Créer un dépôt vide sur GitHub.
2. Initialiser ou conserver le dépôt local, ajouter les fichiers, créer un commit puis pousser la branche principale.
3. Dans Netlify, choisir **Add new site → Import an existing project** et connecter GitHub.
4. Sélectionner le dépôt RéponseAstrale. Netlify doit reconnaître Next.js automatiquement.
5. Vérifier que la commande de build est `npm run build`. Le fichier `netlify.toml` fournit aussi cette valeur et fixe Node 22.
6. Ajouter les variables décrites plus bas, puis lancer le déploiement.
7. Tester toutes les routes publiques, la navigation mobile, la modale d’exemple et le formulaire.
8. Envoyer une vraie demande de test en production et vérifier sa présence dans Netlify Forms avant d’ouvrir le site au public.

Ne pas forcer une ancienne version de l’adaptateur Netlify Next.js : laisser Netlify utiliser son intégration actuelle, sauf instruction explicite de son tableau de bord.

## Domaine OVH

1. Dans Netlify, ajouter `reponseastrale.fr` comme domaine personnalisé.
2. Relever les valeurs DNS exactes indiquées par Netlify.
3. Les saisir dans la zone DNS OVH. Ne pas inventer d’adresse IP ou de CNAME.
4. Choisir le domaine principal et ajouter `www.reponseastrale.fr`.
5. Configurer la redirection de `www` vers le domaine principal, ou l’inverse selon le choix retenu.
6. Attendre la propagation, puis vérifier le certificat HTTPS dans Netlify et tester les deux variantes.

## Netlify Forms

Le formulaire React est envoyé en AJAX sous le nom technique `analyse-gratuite`. Netlify doit connaître ses champs au moment du build : c’est le rôle de `public/netlify-form.html`. Cette page est cachée et ne sert pas d’interface ; elle constitue le blueprint statique lu par Netlify.

Après le premier déploiement :

1. Ouvrir **Forms** dans Netlify et vérifier que `analyse-gratuite` apparaît.
2. Envoyer une soumission réelle depuis le site publié.
3. Contrôler les valeurs, les champs conditionnels, le numéro de dossier et les UTM.
4. Dans les paramètres de notifications de formulaire, ajouter une notification e-mail vers `contact@reponseastrale.fr` pour chaque nouvelle soumission.
5. Tester avec le honeypot vide. Pour vérifier la protection, une soumission automatisée peut renseigner `company-website` et doit être classée comme indésirable.
6. Depuis la liste des soumissions, utiliser les actions Netlify pour exporter en CSV, marquer comme spam ou supprimer une entrée.

Si du spam apparaît, ajouter plus tard la protection anti-spam ou le CAPTCHA recommandé par la documentation Netlify alors en vigueur. Un CAPTCHA visible n’est pas activé aujourd’hui.

### Ajouter ou modifier un champ

Modifier ensemble :

1. `lib/form-schema.ts` ;
2. `components/form/AstroForm.tsx` ;
3. `lib/form-submit.ts` et sa liste `NETLIFY_FIELDS` ;
4. `public/netlify-form.html`.

Exécuter ensuite `npm run test:netlify-fields`. Ce test échoue si la liste et le blueprint HTML ne correspondent plus.

Une numérotation strictement séquentielle nécessiterait une base de données ou un service serveur. Le format actuel `RA-AAAAMMJJ-XXXXXX` est lisible, daté et produit avec un suffixe aléatoire sécurisé.

## Netlify Web Analytics

Dans le tableau de bord du site, ouvrir **Analytics** et activer Netlify Web Analytics. Les statistiques globales sont alors consultables dans cet espace. Cette solution ne couvre pas nécessairement chaque étape du formulaire.

Le fichier `lib/analytics.ts` expose `trackEvent(name, properties)` et prépare les événements `cta_click`, `example_open`, `form_start`, `form_step_view`, `form_step_complete`, `form_validation_error`, `category_select`, `form_submit`, `form_submit_success`, `form_submit_error` et `testimonial_view`. Aucun nom, e-mail, date de naissance, lieu, question ou numéro de dossier complet ne doit être envoyé. Pour mesurer ces événements en détail, brancher ultérieurement un fournisseur respectueux du consentement, puis mettre à jour la politique de confidentialité et le mécanisme de consentement si nécessaire.

## Variables d’environnement

Copier `.env.example` vers `.env.local` pour travailler localement. Dans Netlify, ajouter les mêmes valeurs sous **Site configuration → Environment variables**, puis relancer un déploiement.

| Variable | Rôle | Valeur initiale |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canonique et métadonnées | `https://reponseastrale.fr` |
| `NEXT_PUBLIC_FORM_ENABLED` | Active ou suspend le formulaire | `true` |
| `NEXT_PUBLIC_PROCESSING_DELAY` | Délai affiché | `24 à 48 heures` |
| `NEXT_PUBLIC_HIGH_DEMAND` | Affiche l’alerte de forte demande | `false` |
| `NEXT_PUBLIC_HIGH_DEMAND_MESSAGE` | Texte de l’alerte | voir `.env.example` |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Futur fournisseur d’événements | `none` |
| `GEOCODING_PROVIDER` | Futur fournisseur de lieux | `none` |
| `GEOCODING_API_KEY` | Clé privée éventuelle du géocodage | vide |

Ne jamais placer une clé secrète dans une variable commençant par `NEXT_PUBLIC_`.

## Suspendre le formulaire

1. Dans Netlify, modifier `NEXT_PUBLIC_FORM_ENABLED` en `false`.
2. Enregistrer la variable.
3. Relancer le déploiement depuis **Deploys → Trigger deploy**.
4. Vérifier que la section affiche « Les nouvelles demandes sont temporairement suspendues » et qu’aucun bouton d’envoi actif n’est présent.

Pour conserver le formulaire mais annoncer un délai plus long, garder `NEXT_PUBLIC_FORM_ENABLED=true`, passer `NEXT_PUBLIC_HIGH_DEMAND=true`, adapter le message et remplacer `NEXT_PUBLIC_PROCESSING_DELAY` par le délai réellement annoncé.

## Où modifier les contenus

- marque, URL, délai et navigation : `content/site.ts` ;
- catégories et exemples : `content/questions.ts` ;
- FAQ : `content/faq.ts` ;
- témoignages : `content/testimonials.ts` ;
- exemple anonymisé Vanya : `content/vanya-example.ts` ;
- pages SEO : `content/seo-pages.ts` ;
- informations légales : `content/legal.ts` ;
- textes de la landing page : `app/page.tsx` ;
- logo et icônes : `public/brand/` ;
- formulaire et étapes : `components/form/AstroForm.tsx` ;
- styles, responsive et animations : `app/globals.css`.

Le lieu de naissance fonctionne en saisie libre. `lib/geocoding.ts` définit l’interface permettant d’ajouter plus tard un fournisseur. L’absence de service externe ne bloque jamais le formulaire.

## Architecture principale

```text
app/                    pages, métadonnées, sitemap, robots et manifeste
components/             navigation, footer, landing, formulaire et modale
content/                contenus centralisés et données légales
lib/                    validation, soumission, analytics et identifiants
public/brand/           logo optimisé, favicon et icône Apple
public/netlify-form.html blueprint statique Netlify Forms
tests/                  validation, composants, sérialisation et parité des champs
```

## Évolutions prévues, non développées

L’architecture peut accueillir plus tard Stripe, des crédits, des abonnements, un espace personnel, un historique, la génération de PDF, l’automatisation du traitement, des réseaux sociaux, une newsletter et des conditions générales de vente. Ces éléments ne sont ni activés ni affichés au lancement. Une base de données et une authentification devront être conçues avant d’ajouter comptes, historique ou paiements.

Pour ajouter une newsletter ou un outil d’analytics déposant des cookies, créer d’abord la base de consentement, mettre à jour la politique de confidentialité et activer un gestionnaire de consentement. Aucun bandeau n’est nécessaire aujourd’hui car aucun script publicitaire ou réseau social n’est chargé.
