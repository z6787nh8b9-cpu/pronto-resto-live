# Audit global — PRONTO

## Objet et conclusion

PRONTO possède déjà un socle réel : une application React/Tailwind, un backend Express/tRPC, des sessions persistantes MySQL, des pages publiques et des dashboards. Cependant, l’architecture actuelle ne doit pas recevoir une simple couche cosmétique. Elle est **fortement couplée au métier de la restauration**, comporte plusieurs failles d’autorisation et concentre ses flux principaux dans de très grands composants. La bonne trajectoire est une **migration additive**, découpée en jalons, qui préserve les restaurants, leurs menus et leurs URLs actuelles tout en introduisant le modèle générique de plateforme.

> La refonte doit convertir PRONTO de « créateur de menu pour restaurants » en « plateforme de présence commerciale et de catalogue pour entreprises locales », sans publier une nouvelle surface tant que les accès, migrations et parcours critiques ne sont pas testés.

## État de référence observé

| Domaine | Constat | Risque | Priorité |
|---|---|---|---|
| Build TypeScript | `pnpm check` échoue à cause de deux versions incompatibles de `mysql2` utilisées par le session store. | Le build n’est pas un signal de qualité fiable. | P0 |
| Tests | Le jeu de tests est limité et la suite d’invitations échoue sur des slugs de test persistants. La suite chatbot est lente. | Régressions non détectées avant déploiement. | P0 |
| Dépendances | L’audit remonte 1 vulnérabilité critique, 23 hautes et 50 modérées dans l’arbre de production. | Exposition aux vulnérabilités connues. | P0 |
| Identités | Trois modèles coexistent : Manus `users`, propriétaires OAuth/email et comptes admin. | Autorisation ambiguë et maintenance difficile. | P0 |
| Multi-tenant | L’entité racine est `restaurants`, avec un unique `ownerId`. | Impossible d’exprimer proprement une entreprise, une équipe, plusieurs rôles ou d’autres secteurs. | P0 |
| Imports | Aucun pipeline transactionnel pour CSV, PDF ou photo : extraction, revue, correction et publication ne sont pas séparées. | Données erronées et expérience d’onboarding lente. | P1 |
| Frontend | Plusieurs pages et routeurs dépassent 400 à 1 400 lignes. | Dette UX, duplication, bugs et lenteur d’évolution. | P1 |
| Parcours | Les URLs, libellés et données sont codés autour de « restaurant/menu/plats ». | Proposition de valeur verrouillée sur un seul secteur. | P1 |
| Données personnelles | IP, user-agent et conversations sont stockés sans politique de conservation visible. | Risque de conformité et d’exposition inutile. | P1 |
| Design | Les fondations mélangent plusieurs polices, tokens et animations décoratives continues. | Expérience inégale, accessibilité et performances variables. | P2 |

## Failles et risques à corriger avant l’élargissement

### Contrôle d’accès et authentification

| Gravité | Constat vérifié | Correction cible |
|---|---|---|
| Critique | `invitations.create`, `invitations.listAll` et `invitations.listByRestaurant` sont déclarés en procédure publique. | Restreindre création/listing aux administrateurs ; limiter la consultation par token à la donnée minimale nécessaire. |
| Critique | `adminAuth.loginWithEmail` ouvre une session Super Admin sur la seule connaissance de l’adresse email. | Supprimer ce flux ; le remplacer par un lien signé, à durée de vie courte, à usage unique et envoyé au propriétaire vérifié. |
| Haute | Le login restaurateur par email/mot de passe n’a pas de limite de débit dédiée ni de contrôle anti-automatisation. | Unifier les limites de débit par IP et identifiant, ajouter délai progressif et journal d’événements. |
| Haute | Des messages de logs exposent adresses email, état de session et étapes d’authentification. | Remplacer par une journalisation structurée, minimale, sans secrets ni identifiants personnels. |
| Haute | Les procédures `protectedProcedure`, `adminProcedure` et `restaurantOwnerProcedure` représentent trois formes de session et des règles différentes. | Créer un contexte d’identité unique et un moteur d’autorisations explicite par entreprise et par rôle. |
| Moyenne | Les contournements de rôle en développement rendent le comportement local différent de la production. | Utiliser des identités de test explicites ; ne jamais désactiver les contrôles d’autorisation eux-mêmes. |

### Données, médias et confidentialité

| Gravité | Constat vérifié | Correction cible |
|---|---|---|
| Haute | Le serveur accepte globalement des corps JSON jusqu’à 50 Mo. | Séparer les tailles par route, refuser tôt, réserver les gros fichiers à un flux d’upload signé. |
| Haute | Le proxy de stockage redirige une clé fournie en URL sans validation de préfixe, propriétaire ou durée. | Vérifier le namespace du fichier, la propriété de l’entreprise et utiliser des URLs signées à durée courte. |
| Haute | L’upload actuel reçoit un contenu encodé côté tRPC. | Passer à un upload direct vers stockage, avec fichier temporaire, checksum, type MIME réel et scan/validation. |
| Moyenne | IP, user-agent, référent et conversations sont conservés sans rétention ni anonymisation visible. | Minimiser les données, pseudonymiser les IP, afficher le consentement nécessaire, fixer une rétention et une suppression. |
| Moyenne | Le schéma n’exprime pas les clés étrangères, les contraintes d’unicité métier ni les suppressions en cascade. | Ajouter les relations/contraintes nécessaires via migrations contrôlées et tests de migration. |

## Goulots d’architecture et de produit

### Modèle métier actuel

Les tables `restaurants`, `menuCategories` et `menuItems` structurent le cœur de produit. Les modules horaires, réservations, événements, galerie, traductions et chatbot sont tous rattachés à `restaurantId`. Ce modèle fonctionne pour un restaurant, mais il ne représente pas naturellement un salon, une esthéticienne, un concept store, un artisan ou un prestataire.

Le modèle générique recommandé est le suivant :

| Nouveau concept | Rôle | Compatibilité avec l’existant |
|---|---|---|
| `businesses` | Entreprise/établissement racine, secteur et identité publique. | Un restaurant devient une entreprise avec `vertical = restaurant`. |
| `business_members` | Relation membre–entreprise, rôles et statut d’invitation. | Remplace le seul `ownerId` sans retirer les propriétaires actuels. |
| `catalogs` | Conteneurs publiables : carte, tarifs, services, lookbook, liste de produits. | Un menu existant devient un catalogue de type `menu`. |
| `catalog_collections` | Regroupements : entrées, soins visage, nouveautés, forfaits, accessoires. | Une catégorie de menu devient une collection. |
| `catalog_items` | Produit, service, prestation, forfait ou événement commercial. | Un plat devient un item avec prix, média et métadonnées. |
| `public_pages` | Configuration de la vitrine et de sa navigation. | Préserve les slugs actuels et les pages `/slug/menu`. |
| `media_assets` | Fichiers, dimensions, statut de traitement, propriétaire et usage. | Centralise logos, héro, photos produits et documents. |
| `imports` / `import_rows` | Import, extraction, vérification, correction, publication et erreurs. | Introduit CSV/PDF/photo sans modifier directement les contenus publiés. |

### Architecture applicative

Les pages `RestaurantDashboard.tsx` (1 466 lignes), `AdminManageRestaurant.tsx` (870 lignes) et `SuperAdmin.tsx` (725 lignes) mélangent navigation, données, permissions, formulaires et présentation. Les routeurs `restaurant`, `admin`, `translations` et `events` dépassent aussi une taille raisonnable. La refonte doit découper par domaine : identité, entreprise, catalogue, publication, médias, rendez-vous, insights et opérations.

Le routeur actuel dépend de `/:slug/menu` et `/:slug/dashboard`. Ces URLs doivent rester compatibles, mais la nouvelle route interne doit être construite autour de l’entreprise : `/:slug`, `/:slug/catalogue/:catalogSlug`, `/:slug/book`, `/:slug/contact`, `/:slug/dashboard`.

## Diagnostic UX/UI

La landing actuelle porte une promesse claire mais exclusivement restaurant. Elle reste visuellement trop proche d’une landing SaaS générique : image stock unique, grilles de fonctionnalités régulières, tarifs rigides, témoignages non vérifiables et liens de footer partiellement inactifs. Les dashboards utilisent des blocs denses sans modèle d’action prioritaire ni système de navigation transversal clair.

La direction recommandée est une **plateforme éditoriale et opérationnelle** : une marque PRONTO sobre et technique, avec une navigation flottante légère, une typographie d’interface précise, des surfaces cohérentes, des actions explicites et une densité adaptée aux tâches. Les animations doivent servir l’orientation, les changements d’état et les confirmations ; elles ne doivent pas tourner en continu sans raison. Les états chargement, vide, erreur, confirmation, déconnexion et absence d’accès doivent être conçus comme des parcours, et non comme des exceptions.

## Parcours cible

| Moment | Expérience cible |
|---|---|
| Découverte | Choisir « ce que je vends/propose » plutôt que « quel restaurant suis-je ». |
| Création | Nom, secteur, objectif, identité visuelle et une première vitrine en moins de cinq minutes. |
| Import | Choisir CSV, photo ou PDF ; visualiser les données extraites ; corriger ; publier explicitement. |
| Gestion | Tableau de bord avec prochaine action, statut public, contenus, demandes, rendez-vous et performances. |
| Publication | Aperçu mobile/desktop, contrôles de visibilité, URL, partage et historique de version. |
| Compte | Équipe, rôles, sessions actives, sécurité, récupération, facturation et suppression/export. |
| Administration | Recherche multi-entreprises, support avec délégation tracée, modération, audit des accès et états d’incident. |

## Ordre d’exécution obligatoire

1. Stabiliser la qualité du socle : dépendances, TypeScript, tests isolés et garde-fous de déploiement.
2. Corriger les failles de contrôle d’accès et supprimer les connexions non vérifiées.
3. Définir et migrer le modèle générique de manière additive, en gardant les tables et URLs existantes comme compatibilité.
4. Construire la médiathèque et l’import avec une zone de brouillon, aucune publication automatique.
5. Recomposer les dashboards et les vitrines autour du nouveau modèle.
6. Lancer la nouvelle landing multi-secteurs seulement après validation des flux de compte, publication et import.

## Mise à jour du jalon de sécurisation

Le premier jalon a rétabli la vérification TypeScript et validé 17 tests automatisés. La mise à niveau ciblée des dépendances a supprimé la vulnérabilité critique identifiée au départ et réduit l’audit de **1 critique / 23 hautes / 50 modérées** à **0 critique / 3 hautes / 30 modérées**. Les trois alertes élevées restantes sont transitives : `path-to-regexp` via Express 4 et `lodash`/`lodash-es` via des composants de visualisation ou de rendu. Leur traitement propre nécessite une mise à niveau majeure, testée séparément, d’Express et des composants concernés ; il ne sera pas forcé dans une migration de sécurité silencieuse.

## Décisions de conception à préserver

Les restaurants existants, leurs slugs, leurs cartes, leurs médias et leurs dashboards restent accessibles. La logique de réservation, d’événement et de menu reste un module vertical « restaurant » au-dessus du noyau générique. La prochaine migration ne renomme ni ne supprime les tables existantes en production : elle ajoute les nouveaux concepts, migre progressivement les données et ne bascule un parcours qu’après des tests d’équivalence.
