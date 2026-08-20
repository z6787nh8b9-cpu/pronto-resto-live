# Validation d’indépendance applicative — PRONTO

## Objet et périmètre

Cette vérification distingue strictement l’**application PRONTO** de son infrastructure d’hébergement actuelle. Elle confirme que les parcours visibles et métier n’emploient plus de redirection, d’authentification ou de ressource cliente Manus. Elle ne prétend pas supprimer les adaptateurs serveur de stockage, IA, cartes et notification déjà documentés pour remplacement ultérieur.

| Contrôle | Preuve reproductible | Résultat |
|---|---|---|
| Sources client | Recherche insensible à la casse dans `client/src` | Aucune référence Manus trouvée |
| Bundle public | Construction PWA puis recherche dans `dist/public` | Aucune référence Manus, OAuth Manus ou API Manus exposée |
| Connexion locale | Rendu de `/login-restaurant` et analyse textuelle | Aucune mention Manus dans la page servie |
| Sessions et droits | Tests sessions, aperçus protégés, invitations Super Admin et bundle | 9 tests passants |
| Vitrines brouillon | Régression `business-preview` et contrôle multi-secteurs | Les aperçus restent réservés au Super Admin ; les brouillons ne sont pas publics |
| PWA | Test de configuration, manifeste et inspection du service worker généré | Manifeste PRONTO B2B valide ; aucun cache runtime d’API authentifiée |
| Capacitor | Régression PWA | Bundle natif déclaré sur `dist/public`, identifiant `page.pronto.b2b` |

## Résultat

Le 19 août 2026, le bundle PWA de production a été reconstruit avec succès. Il contient le manifeste installable, le service worker et le pré-cache d’assets statiques, sans stratégie de cache runtime pour `/api` ou tRPC. Les réponses authentifiées restent donc exclues du cache du service worker.

Les contrôles automatisés ciblés couvrent les sessions, la protection de l’aperçu, les invitations Super Admin locales et l’entrée HTML publique. Ils passent tous. La recherche dans les sources client et dans les assets compilés ne retourne aucune référence Manus. Les parcours propriétaires et Super Admin reposent respectivement sur les sessions PRONTO locales/Passport et `admin_accounts`, sans OAuth Manus applicatif.

> Les dépendances serveur et d’hébergement recensées dans l’audit de découplage demeurent explicitement hors périmètre. Elles ne sont ni chargées par le navigateur ni nécessaires aux parcours d’authentification, mais exigent un remplacement fournisseur planifié avant une migration d’infrastructure complète.

## Nettoyage des contrats de principal

Une analyse des tables `business_members` et `import_jobs` a confirmé qu’aucune donnée active ne reposait sur l’ancienne variante de principal. La migration `0033_glamorous_tusk.sql` limite désormais les deux énumérations aux seuls principaux PRONTO `restaurant_owner` et `admin_account`. Le fallback correspondant a été retiré du routeur d’import ; sa régression vérifie l’absence de cette variante dans le routeur et le schéma.

Les routeurs métier d’horaires et de traduction ne consultent plus non plus le principal historique pour accorder un droit administrateur. Leurs contrôles reposent désormais exclusivement sur `restaurantOwner` pour le propriétaire concerné et `adminAccount` pour le Super Admin PRONTO. Une régression dédiée verrouille cette absence de fallback.

## Régressions exécutées

| Commande | Résultat |
|---|---|
| `pnpm vitest run server/session.test.ts server/business-preview.test.ts server/local-admin-invitations.test.ts server/bundle-independence.test.ts` | 9 tests passants |
| `pnpm vitest run server/pwa-config.test.ts` | 1 test passant |
| `pnpm pwa:build` | Build de production réussi, service worker généré |
| `pnpm exec tsc` puis `pnpm vitest run` | TypeScript valide et 57 tests passants lors du jalon précédent |

## Validation manuelle contrôlée d’import CSV

Le 20 août 2026, le parcours propriétaire authentifié de La Voile Rouge a analysé un CSV minimal dans un catalogue de validation explicitement nommé. Le brouillon affichait une catégorie et un élément, puis son application a confirmé que le catalogue restait au statut `draft` et **non publié**. Aucun contenu n’a été envoyé vers la vitrine publique.

Le catalogue temporaire, son élément, sa collection, ses lignes d’import et son job appliqué ont ensuite été supprimés de manière ciblée. Un contrôle SQL final confirme `0` catalogue temporaire, `0` job temporaire et `0` catalogue de validation publié.

> **Limite explicitement conservée :** l’adaptateur de stockage actuellement disponible sait écrire et lire un objet, mais ne fournit pas encore de suppression physique. Le fichier CSV de validation peut donc subsister comme objet de stockage non référencé ; il n’est plus accessible depuis l’application ni depuis la base. La suppression physique et la rétention des sources d’import sont désormais suivies comme un chantier distinct, avant toute promesse de purge complète.

## Protection anti-abus du chatbot public

Le point d’entrée public `chat.sendMessage` dispose désormais d’un budget distinct de **10 messages par minute et par adresse IP**. Cette limite s’applique avant l’exécution du routeur tRPC, ne consomme pas le budget des autres procédures et renvoie une réponse `429` explicite après épuisement. La régression vérifie à la fois le blocage du onzième message et l’absence d’impact sur une procédure tRPC différente.
