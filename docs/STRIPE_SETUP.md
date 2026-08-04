# Stripe — environnement de test

## Catalogue

Créer dans le compte Stripe **test** deux prix ponctuels EUR :

- 1 Soleil : 19,90 €, validité applicative 7 jours ;
- 3 Soleils : 49,90 €, validité applicative 30 jours.

Renseigner leurs identifiants dans `STRIPE_PRICE_ONE_SUN` et `STRIPE_PRICE_THREE_SUNS`. Les anciens prix connus du dépôt sont explicitement refusés ; ne pas réutiliser les offres historiques à 5,90 € ou 13,90 €.

## Variables

Configurer côté serveur seulement : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, les deux identifiants de prix, `STRIPE_ENVIRONMENT=test` et `STRIPE_AUTOMATIC_TAX=false`. Aucune clé ne va dans Git ni dans un composant client.

## Webhook

Créer un endpoint test vers `/api/stripe/webhook` pour `checkout.session.completed`. Le handler lit le corps brut, vérifie la signature, déduplique l’événement et contrôle le prix, le montant, la devise et le produit avant attribution transactionnelle des Soleils. La page succès n’attribue rien.

En local : utiliser Stripe CLI avec `stripe listen --forward-to localhost:3000/api/stripe/webhook`, puis placer le secret temporaire uniquement dans `.env.local`. Tester la répétition du même événement.

## Remboursements

Le remboursement reste une opération Stripe administrative. Avant d’accorder un remboursement, inspecter l’état de la commande, du Soleil et de la question. La synchronisation automatique des événements `charge.refunded` et litiges reste à ajouter avant production réelle.

## Passage futur en production

Créer des produits/prix live distincts, un endpoint webhook live et des clés live limitées. Compléter d’abord la checklist juridique, exécuter une preview, confirmer les e-mails et la fiscalité, puis basculer `STRIPE_ENVIRONMENT=live`. Le code bloque les clés live en environnement test et bloque le live si les champs juridiques obligatoires restent incomplets.
