# Passerelle RéponseAstrale Studio

Le Studio local calcule le thème, prépare les contenus et publie les réponses. Neon demeure la source de vérité des commandes, comptes, Soleils, questions et réponses. Le dépôt Studio n’a pas été modifié.

## Authentification

Chaque requête utilise `Authorization: Bearer <STUDIO_API_TOKEN>` sur HTTPS. Le jeton reste côté serveur, est comparé en temps constant et n’est jamais envoyé au navigateur. Le Studio ne reçoit ni clé Stripe, ni chaîne de connexion Neon, ni données de paiement.

## API

- `GET /api/studio/questions?status=submitted` : liste minimale des questions et données de thème nécessaires.
- `POST /api/studio/questions/{id}/claim` : passage atomique à `processing`.
- `POST /api/studio/questions/{id}/answer` : `{ answerText, pdfUrl?, promptVersion, model, generationCostCents? }`.
- `POST /api/studio/questions/{id}/fail` : `{ reason }`.
- `POST /api/studio/charts/{id}/access-link` : crée un lien opaque valable 30 jours pour `/exploration?token=...`.

Le listing est limité à 50 éléments et l’API applique un rate limit best-effort. Pour la production multi-instance, remplacer ce limiteur mémoire par un stockage partagé. Le Studio doit mémoriser ses identifiants de traitement et supporter les réponses 409/idempotentes sans publier deux fois.
