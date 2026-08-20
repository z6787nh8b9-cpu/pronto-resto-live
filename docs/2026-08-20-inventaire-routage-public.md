# Inventaire de routage public et administratif

## Périmètre de l’audit

Cet inventaire couvre les routes déclarées dans `client/src/App.tsx` et les cibles internes recherchées dans le code client. Il distingue les routes réservées, qui doivent être évaluées avant la route générique `/:slug`, des pages d’établissement publiées.

| Groupe | Routes vérifiées | Statut |
|---|---|---|
| Marketing | `/`, `/tarifs`, `/terms` | Routes réservées, déclarées avant `/:slug`. |
| Authentification | `/login-restaurant`, `/reset-password`, `/invite/:token`, `/invite-admin/:token` | Routes réservées, non concurrentes avec une vitrine. |
| Administration | `/admin/login`, `/admin/magic-login`, `/admin/preview/:slug`, `/admin/restaurants/:id`, `/admin` | Routes réservées, avec la route restaurant spécifique placée avant `/admin`. |
| Établissement | `/:slug/dashboard`, `/b/:slug`, `/:slug/menu`, `/:slug/events`, `/:slug` | Routes spécifiques déclarées avant la vitrine générique. |

## Constats et décisions

La route de prévisualisation administrative `/admin/preview/:slug` est conservée : elle est réservée aux flux Super Admin et ne concurrence pas la vitrine générique. Les anciennes routes commençant par `/preview/` ne sont plus déclarées par le routeur client.

Le lien `/terms` de la connexion propriétaire ne possédait pas de destination déclarée. Une page minimale de conditions, sans souscription ni paiement, a été ajoutée afin d’éliminer cette impasse de navigation. Les conditions contractuelles complètes restent un livrable légal à finaliser avant toute ouverture commerciale.

> La régression `server/app-routing.test.ts` vérifie que chaque route réservée critique est déclarée avant `/:slug`, ce qui protège les chemins système contre une interprétation comme slug d’établissement.
