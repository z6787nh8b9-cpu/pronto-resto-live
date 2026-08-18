# Architecture cible — PRONTO, plateforme multi-secteurs

## Principe directeur

PRONTO devient un produit de présence commerciale pour les entreprises locales. Une entreprise peut proposer des produits, des services, des forfaits, des événements, des créneaux ou une combinaison de ces contenus. La restauration reste une verticale majeure, mais n’est plus l’entité structurante de la plateforme.

La migration respecte quatre garanties. Les slugs, pages publiques, cartes et dashboards de restaurants déjà publiés restent disponibles. Les nouvelles tables sont ajoutées avant tout basculement. Les données importées restent en brouillon jusqu’à une validation explicite. Toute autorisation dépend d’une relation explicite entre une identité, un rôle et une entreprise.

## Noyau de domaine proposé

| Domaine | Entité | Responsabilité |
|---|---|---|
| Entreprise | `businesses` | Identité du compte entreprise, secteur, statut, slug et compatibilité vers l’ancien restaurant. |
| Profil | `business_profiles` | Coordonnées, réseaux, géolocalisation, identité visuelle, SEO, paramètres de vitrines. |
| Équipe | `business_members` | Membre, rôle, statut d’invitation, dernière activité et droits sur une entreprise. |
| Catalogue | `catalogs` | Ensemble publiable : menu, prestations, produits, liste de prix, lookbook, événementiel. |
| Collection | `catalog_collections` | Catégorie, rayon, univers, traitement, forfait ou sous-ensemble d’un catalogue. |
| Élément | `catalog_items` | Produit, service, plat, article, prestation ou forfait. |
| Variantes | `catalog_item_variants` | Taille, formule, durée, prix de départ, option et disponibilité. |
| Médias | `media_assets` | Fichier propriétaire, dimensions, mime réel, statut, usages et métadonnées de traitement. |
| Import | `imports` / `import_rows` | Source, brouillon, erreurs, proposition de mapping, corrections et statut de publication. |
| Vitrine | `public_pages` | Modules visibles, sections, navigation, domaine et statut de publication. |
| Demandes | `inquiries` / `appointments` | Contacts, demandes, réservation de créneau et leur cycle de traitement. |
| Audit | `audit_events` | Qui a fait quoi, sur quelle entreprise, depuis quel flux, avec rétention définie. |

## Compatibilité avec la restauration

| Ancien modèle | Nouveau modèle | Règle de transition |
|---|---|---|
| `restaurants` | `businesses` + `business_profiles` | Une ligne `businesses` est créée pour chaque restaurant, avec `legacyRestaurantId` unique. |
| `menuCategories` | `catalog_collections` | Les catégories sont conservées puis synchronisées vers un catalogue `menu`. |
| `menuItems` | `catalog_items` | Les plats deviennent des items de type `product` avec les métadonnées alimentaires en extension. |
| `restaurant_owners` | `business_members` | Le propriétaire actuel reçoit le rôle `owner` de l’entreprise correspondante. |
| Réservation / événements | Modules par verticale | Les tables restent actives ; une couche d’adaptation les rattache progressivement à `businesses`. |
| `/:slug/menu` | Route de compatibilité | L’URL reste une vue de catalogue dédiée au type `menu`. |

## Secteurs et modules

Le secteur n’est pas une source de tables dupliquées. Il sert à composer une expérience initiale, des libellés et des modules activables.

| Secteur | Catalogues initiaux | Modules proposés |
|---|---|---|
| Restaurant / bar | Carte, boissons, tapas, événements | Horaires, réservation, allergènes, commande externe. |
| Salon / beauté | Prestations, soins, tarifs, forfaits | Prise de rendez-vous, durée, équipe, galerie avant/après. |
| Retail / concept-store | Nouveautés, collections, produits | Variantes, stocks affichés, redirection e-commerce. |
| Artisan / service | Services, réalisations, packs | Demande de devis, zones d’intervention, portfolio. |
| Événementiel | Prestations, formules, agenda | Demande de disponibilité, capacité, billetterie externe. |

## Identité, équipes et autorisation

L’application ne doit plus considérer les comptes « admin », « restaurateur » et « utilisateur OAuth » comme des modèles séparés de permission. Elle doit distinguer :

| Couche | Rôle |
|---|---|
| Compte | Une personne ou organisation qui se connecte. |
| Identité | Méthode de connexion rattachée à un compte : mot de passe, Google, Facebook, Manus, lien de récupération. |
| Membership | Relation d’un compte avec une entreprise. |
| Rôle | `owner`, `administrator`, `editor`, `publisher`, `analyst`, `support`. |
| Permission | Action réelle : gérer l’équipe, modifier un catalogue, publier, lire les analyses, administrer les comptes. |

Le Super Admin devient un rôle de plateforme, séparé des rôles d’entreprise. Une délégation de support est possible, mais doit être temporaire, explicitement activée, visible dans l’interface et journalisée.

## Parcours d’import

### Import CSV

Le fichier est vérifié avant traitement. L’utilisateur associe les colonnes aux champs attendus, prévisualise les lignes valides et invalides, corrige les erreurs, puis déclenche la création d’un brouillon. La publication reste une action séparée.

### Import photo ou PDF

Le média est stocké comme document source. Une extraction structurée propose collections et items, avec un niveau de confiance par champ. L’utilisateur contrôle le résultat dans une table de revue avant création du brouillon. Aucun contenu public n’est écrit à partir d’une réponse IA non confirmée.

### Règles de sûreté

Chaque import conserve : l’auteur, la source, la version de mapping, les erreurs, la date, le statut et le résultat de validation. Un import peut être annulé tant qu’il n’est pas publié. La publication produit un événement d’audit et est réversible par version.

## Contrats d’API proposés

Les procédures tRPC sont séparées par domaine et jamais par écran :

| Namespace | Responsabilités |
|---|---|
| `account` | Inscription, connexion, récupération, sécurité, sessions. |
| `business` | Création, profil, équipe, secteurs, disponibilité, publication. |
| `catalog` | Catalogues, collections, items, variantes, ordre et statut. |
| `media` | Upload signé, statut, usages, suppression et récupération. |
| `imports` | Création de session d’import, analyse, mapping, validation et publication. |
| `publicSite` | Vitrine publiée, catalogue public, formulaires, réservation/demande. |
| `platform` | Super Admin, support, métriques, audit, modération et facturation. |

Tous les appels de mutation vérifient la permission sur l’entreprise cible côté serveur. Une procédure ne prend jamais un identifiant d’entreprise comme preuve de droit d’accès.

## Migration par jalons

| Jalon | Contenu | Effet sur l’existant | Critère de sortie |
|---|---|---|---|
| 0. Stabilisation | Dépendances, TypeScript, tests, vulnérabilités, contrôles d’accès. | Aucun changement fonctionnel visible. | Build vert, tests isolés, failles P0 neutralisées. |
| 1. Noyau entreprise | Tables `businesses`, profils, membres, rôles et audit. | Restaurants existants synchronisés en lecture/écriture contrôlée. | Chaque restaurant possède son entreprise miroir et son owner. |
| 2. Noyau catalogue | Tables catalogues/collections/items et adaptateurs menu. | Les menus actuels restent rendus depuis les anciennes routes. | Données menu équivalentes dans le nouveau modèle, comparaison automatisée. |
| 3. Médias et imports | Médiathèque, upload direct, import CSV/PDF/photo en brouillon. | Aucun média existant supprimé. | Import contrôlé et publication explicite testés. |
| 4. Dashboards | Nouvelle navigation et surfaces d’administration. | Ancien dashboard disponible derrière les routes existantes durant transition. | Tâches de base réalisées sans régression. |
| 5. Vitrines | Pages publiques adaptatives, catalogues et modules par secteur. | `/slug/menu` maintenu comme compatibilité. | Rendu mobile, SEO et parcours contact validés. |
| 6. Bascule progressive | Feature flags, observabilité et migration des nouveaux comptes. | Rollback possible par entreprise. | Aucun incident critique sur une fenêtre de validation. |

## Contraintes non négociables

La migration ne renomme pas ni ne supprime les tables existantes dans la première version. Les imports, décisions de publication et changements de droits sont auditables. Les emails de récupération et les invitations n’exposent jamais de jeton en clair en base. Les contrôles d’accès sont testés avec un membre sans droit, un éditeur, un owner et un Super Admin. Les composants clients restent mobiles, navigables au clavier et respectueux de `prefers-reduced-motion`.

## Première livraison de la refonte

La première livraison technique ne doit pas tenter de refaire tous les écrans à la fois. Elle doit sécuriser l’identité, corriger les routes d’invitation, stabiliser le build et introduire le noyau générique minimal. Ce socle permet ensuite de construire l’import et les nouvelles interfaces sans continuer à accumuler les exceptions « restaurant ».
