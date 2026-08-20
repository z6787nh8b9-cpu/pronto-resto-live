# Préparation PWA et Capacitor — PRONTO B2B

## État validé

PRONTO construit sa PWA dans `dist/public`. Ce chemin correspond exactement au `webDir` de Capacitor, ce qui garantit que `pnpm cap:sync` synchronisera le même bundle web que celui produit par `pnpm pwa:build`. Le manifeste déclare une application métier installable, avec une icône PNG 1024 × 1024 utilisable en mode maskable et un enregistrement de service worker qui demande explicitement l’accord utilisateur avant une mise à jour.

| Élément | Contrat actuel | Décision |
|---|---|---|
| Identité native | `page.pronto.b2b` / `PRONTO B2B` | Stable, à conserver après toute première soumission en store. |
| Bundle web | `dist/public` | Produit par Vite et utilisé par Capacitor. |
| Cache runtime | Désactivé pour les appels API | Les réponses de session et de données B2B ne sont pas mises en cache par le service worker. |
| Projets iOS / Android | Non créés | Évite des identifiants, signatures et fichiers natifs jetables avant les décisions de store. |

## Parcours de création native

Lorsque les identifiants de store, les certificats et les comptes de distribution seront disponibles, lancer `pnpm pwa:build`, créer une seule fois la cible requise avec `pnpm cap add ios` ou `pnpm cap add android`, puis utiliser `pnpm cap:sync` à chaque version du bundle. Les dossiers `ios/` et `android/` doivent ensuite être versionnés avec les réglages de signature, les politiques de confidentialité et les autorisations réellement retenues.

> Ne pas configurer de serveur de développement distant dans Capacitor pour une version de store. Le bundle embarqué doit rester la source de vérité et les appels authentifiés doivent viser une origine HTTPS de production explicitement configurée pour l’application native.

## Pré-requis avant soumission

La création d’un projet natif doit être précédée de la configuration d’une origine API de production dédiée au runtime Capacitor, car une WebView native ne possède pas l’origine web `https://pronto.page`. Cette étape doit être couplée à la revue des redirections OAuth, des liens de réinitialisation de mot de passe, de la politique de confidentialité et des comptes développeur Apple et Google. Elle est volontairement séparée de ce jalon pour ne pas figer des secrets ou des identifiants de distribution avant leur disponibilité.
