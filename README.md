# PRONTO

> **Une présence en ligne claire pour les entreprises qui ont quelque chose à montrer.**

PRONTO est une plateforme SaaS multi-tenant qui permet aux commerces et entreprises locales de transformer un menu, une grille tarifaire, un catalogue de produits ou une liste de prestations en une **vitrine publique soignée, maintenable et prête à partager**.

Le produit a été conçu pour les restaurants, bars, salons de beauté, boutiques, artisans, prestataires de services et activités événementielles. La restauration reste une verticale complète, mais elle n’est plus le modèle unique de la plateforme.

| Produit | Environnements disponibles | Stack principale |
|---|---|---|
| **PRONTO** | [pronto.page](https://pronto.page) · [prévisualisation](https://prontoresto-lrdq8kkk.manus.space) | React · TypeScript · Express · tRPC · TiDB |

---

## Pourquoi PRONTO

Une entreprise locale ne devrait pas dépendre d’une agence pour une modification de prix, une nouvelle prestation, une carte de saison ou une information pratique. PRONTO rassemble la vitrine publique, le catalogue, les médias, les demandes et les parcours de publication au même endroit.

Le principe est simple : **importer, relire, organiser, puis publier**. Le système ne publie jamais un contenu importé sans une action explicite de l’entreprise.

| Avant PRONTO | Avec PRONTO |
|---|---|
| Fichiers éparpillés, menu PDF figé, demandes sur plusieurs canaux | Un espace de travail et une vitrine publique cohérente |
| Mise à jour confiée à un tiers | Catalogue, collections et contenus administrables directement |
| Import risqué ou manuel | Brouillon contrôlé, revue explicite et publication séparée |
| Produit limité à un seul secteur | Modèle adaptable aux produits, services, prix, événements et disponibilités |

---

## Fonctionnalités

### Vitrines publiques

Chaque entreprise dispose d’une page publique centrée sur son identité, son catalogue et ses informations utiles. Les routes historiques des restaurants sont conservées afin de ne pas casser les liens existants, notamment `/:slug/menu`.

Les vitrines intègrent une image de couverture, une navigation de collections, une recherche, des filtres, des médias, les contenus de catalogue et des modules métiers selon l’activité : réservation, événements, horaires, demandes de contact ou liens externes.

### Dashboard entreprise

L’espace de gestion rassemble les contenus, les médias, l’onboarding, les réglages de profil, les fonctions IA, les horaires et les modules premium. Son vocabulaire est conçu pour parler de **catalogues, collections et éléments**, tout en préservant les parcours restaurant existants.

### Imports contrôlés

PRONTO accepte les sources **CSV, PDF et images**. Le parcours protège la publication : le fichier est contrôlé, analysé, converti en proposition de catalogue et créé comme brouillon. La revue est obligatoire avant l’application, et la publication reste une étape distincte.

### Médiathèque

La médiathèque associe chaque fichier à son entreprise propriétaire. Les types MIME, tailles et signatures binaires sont contrôlés avant traitement. L’archivage est réversible, afin d’éviter les suppressions accidentelles de contenus utiles.

---

## Secteurs pris en charge

| Secteur | Catalogues typiques | Modules utiles |
|---|---|---|
| Restaurant et bar | Carte, boissons, tapas, vins | Horaires, réservation, allergènes, événements |
| Beauté et bien-être | Soins, prestations, forfaits, tarifs | Rendez-vous, durée, galerie, équipe |
| Boutique et retail | Produits, collections, nouveautés | Variantes, redirections e-commerce, stock affiché |
| Artisan et service | Services, réalisations, packs | Demandes de devis, zones d’intervention, portfolio |
| Événementiel | Prestations, formules, agenda | Capacité, inscription, disponibilité |

---

## Architecture

```text
┌───────────────────────────────────────────────────────────────────┐
│                           CLIENT REACT                              │
│ Landing · Vitrines publiques · Dashboard entreprise · Super Admin   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ tRPC / HTTPS
┌───────────────────────────────▼───────────────────────────────────┐
│                         EXPRESS + tRPC                              │
│ Auth · contrôle d’accès · imports · médias · réservations · IA      │
└───────────────┬──────────────────────────┬────────────────────────┘
                │                          │
      ┌─────────▼─────────┐      ┌─────────▼─────────┐
      │   TiDB / MySQL    │      │  Stockage objet S3 │
      │ Domaine & audit   │      │  Médias validés    │
      └───────────────────┘      └───────────────────┘
```

Le noyau métier repose sur les entités suivantes.

| Domaine | Entités principales | Rôle |
|---|---|---|
| Entreprise | `businesses`, `business_profiles`, `business_members` | Identité, profil, secteur, appartenance et accès |
| Catalogue | `catalogs`, `catalog_collections`, `catalog_items` | Menus, produits, services, forfaits et événements |
| Import | `import_jobs`, `import_job_rows` | Source, brouillon, revue et application contrôlée |
| Médias | `media_assets` | Propriété, validation binaire et archivage réversible |
| Sécurité | `password_reset_tokens`, `security_events`, sessions persistantes | Réinitialisation, audit et continuité de session |

---

## Identités, rôles et sécurité

PRONTO distingue strictement les accès de plateforme des accès d’entreprise.

| Identité | Connexion | Portée |
|---|---|---|
| **Super Admin** | Email et mot de passe | Supervision de la plateforme et de l’ensemble des entreprises |
| **Propriétaire d’entreprise** | Email / mot de passe, Google ou Facebook | Accès limité aux entreprises auxquelles il est rattaché |
| **Développeur** | Manus OAuth | Accès technique distinct, sans se substituer aux rôles métier |

Les protections mises en place couvrent notamment la rotation de session à la connexion, les limites de débit sur les parcours sensibles, les réinitialisations de mot de passe à jeton à usage unique, les journaux de sécurité sans données sensibles, les en-têtes HTTP de sécurité et les contrôles d’accès côté serveur sur l’entreprise ciblée.

> Un identifiant d’entreprise fourni par un client n’est jamais considéré comme une preuve d’autorisation. Toute mutation est contrôlée côté serveur contre l’identité et l’appartenance actives.

---

## Choix techniques

| Couche | Technologies |
|---|---|
| Interface | React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, wouter |
| Interactions | dnd-kit, Sonner, LDRS, animations accessibles et respect de `prefers-reduced-motion` |
| API | Node.js, Express 4, tRPC, Zod |
| Données | TiDB Cloud compatible MySQL, Drizzle ORM |
| Authentification | Passport, OAuth Google/Facebook, email et mot de passe, session MySQL persistante |
| Stockage | Stockage objet S3 et Uploadcare côté interface |
| IA | Extraction structurée côté serveur pour les imports PDF et image |
| Tests | Vitest, contrôle TypeScript et tests d’intégration ciblés |

---

## Lancer le projet localement

### Prérequis

Installez Node.js 22+, `pnpm`, puis configurez les variables d’environnement attendues par le projet. Les identifiants et secrets ne doivent jamais être commités.

```bash
pnpm install
pnpm dev
```

Le serveur de développement démarre sur le port attribué par l’environnement. Ne forcez pas un port dans le code serveur.

### Contrôles de qualité

```bash
# Vérification TypeScript
pnpm check

# Suite de régression Vitest
pnpm test
```

La suite actuelle couvre les sessions, les invitations, les autorisations entreprise, les imports, les réservations, les traductions, les réinitialisations de mot de passe, la validation média et les protections reCAPTCHA.

---

## Organisation du code

```text
client/
  src/pages/              Pages publiques, dashboard, Super Admin
  src/components/         Composants partagés et composants métier
  src/lib/                Client tRPC et utilitaires d’interface

server/
  _core/                  Sessions, contexte tRPC, sécurité, OAuth
  routers/                Domaines métier séparés par responsabilité
  *.test.ts               Tests Vitest de régression et d’intégration

drizzle/
  schema.ts               Schéma relationnel et contrats de domaine
  migrations/             Migrations de base de données

docs/                     Architecture, audit, exploitation et validations
scripts/                  Migration de compatibilité et données de référence
```

---

## Scripts de démonstration et secrets

Les scripts du dossier [`scripts/`](./scripts) servent à préparer ou migrer des données de référence. Ils ne contiennent aucun identifiant exploitable et ne doivent jamais recevoir de secret dans le code, un commit, une sortie de journal ou un fichier versionné.

Les scripts de données de démonstration demandent explicitement les variables d’environnement suivantes au moment de leur exécution :

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | Connexion à la base de données cible |
| `LAVOILE_ROUGE_SEED_EMAIL` | Adresse du compte propriétaire de démonstration |
| `LAVOILE_ROUGE_SEED_PASSWORD` | Mot de passe choisi localement pour ce compte |

Chargez ces valeurs depuis un gestionnaire de secrets ou votre environnement local, puis exécutez les scripts uniquement contre un environnement explicitement identifié. Ne créez pas de fichier `.env` versionné et renouvelez immédiatement toute valeur qui aurait été communiquée par erreur.

---

## Exploitation et déploiement

Le projet est déployé via l’environnement Manus. Avant toute publication, créez un point de contrôle, exécutez les contrôles de type et les tests concernés, puis publiez depuis l’interface de gestion.

Les médias applicatifs sont conservés dans le stockage objet, et non dans le dépôt. Les migrations de schéma doivent toujours être générées, relues et appliquées de manière explicite afin de préserver les données existantes.

Pour une prise en main opérationnelle, consultez les documents du dossier [`docs/`](./docs) : architecture multi-secteurs, audit global, exploitation et reprise, direction de landing et validations visuelles.

---

## État du projet

La refonte multi-secteurs est menée par jalons : sécurisation de l’authentification, migration du noyau entreprise, compatibilité restaurant, imports contrôlés, médiathèque, onboarding et harmonisation progressive des interfaces. Les routes et données historiques de restauration restent préservées pendant la transition.

Les améliorations de produit à venir sont suivies dans [`todo.md`](./todo.md). Les tâches de production nécessitant un test manuel — notamment les parcours OAuth et les imports avec fichiers réels — sont volontairement distinctes des validations automatisées.

---

<p align="center">
  <strong>PRONTO</strong><br />
  Une solution portée par <a href="https://altmachine.fr">ALTMachine</a>.
</p>
