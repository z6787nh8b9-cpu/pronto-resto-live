# Frontière des services externes — PRONTO

## Objet

Les parcours métier PRONTO restent indépendants des services d’infrastructure : les droits, sessions, catalogue, vitrines, réservations et administration utilisent l’application et la base de données PRONTO. Les services externes restants sont confinés au serveur et peuvent être remplacés par domaine sans modifier le client métier.

| Domaine | Point d’intégration serveur actuel | Contrat PRONTO à préserver | Remplacement futur possible |
|---|---|---|---|
| Médias | Proxy d’assets et helpers de stockage | URL média, clé opaque, type MIME, durée de cache | Bucket S3/R2/B2 avec URLs signées. |
| IA | Chatbot, extraction d’import, génération | Entrée structurée, sortie structurée, erreurs explicites | Fournisseur LLM/API autonome via clé serveur. |
| Cartographie | Composant carte et appels serveur | Adresse, coordonnées, recherche d’établissement | Google Maps direct, Mapbox ou autre fournisseur. |
| Notifications | Alerte technique au propriétaire | Titre, contenu, résultat de livraison | Email transactionnel, webhook ou outil d’astreinte. |

## Règles de migration

Le client ne doit jamais connaître de clé de serveur, de token de stockage ni de fournisseur IA. Chaque remplacement conserve les contrats métiers et passe d’abord par une mise en parallèle : lecture des médias existants, appel IA contrôlé, test de notification, puis bascule. Les URLs publiques ne porteront pas le nom du fournisseur ; elles resteront sous les routes PRONTO.

> La migration de ces services est différée volontairement : les retirer sans remplacement désactiverait des fonctions existantes. L’authentification et les parcours métier PRONTO ne reposent déjà plus sur Manus OAuth ni sur ses redirections client.
