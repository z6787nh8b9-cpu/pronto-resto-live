# Guide Super Admin

## Accès et périmètre

Le centre de contrôle Super Admin est disponible à l’adresse `/admin`. Il requiert une session Super Admin locale valide. Cette zone est séparée des dashboards propriétaires : elle sert à superviser les entreprises, les accès et les contenus transversaux sans exposer les mots de passe, jetons de session ou identifiants de fournisseurs.

| Onglet | Usage opérationnel |
|---|---|
| Vue d’ensemble | Consulte les indicateurs globaux d’entreprises actives, abonnements enregistrés et conversations assistées. |
| Entreprises | Crée, recherche, modifie ou supprime des établissements ; consulte la formule et le statut d’abonnement. |
| Propriétaires | Consulte l’annuaire sans secrets et réalise un transfert, une dissociation, une suspension ou un rétablissement explicitement confirmé. |
| Publicités | Gère les campagnes compatibles avec les vitrines où elles sont autorisées. |
| Admins | Gère les comptes administratifs et leurs invitations selon les droits accordés. |
| Invitations | Suit les invitations propriétaires et administratives, leur statut et leur expiration. |
| Demandes | Traite les demandes soumises depuis les parcours d’assistance. |

## Gérer une entreprise

La création d’une entreprise initialise son identité, son slug, ses coordonnées et son niveau de formule. Les formules `menu`, `pro` et `premium`, ainsi que leurs statuts, restent des réglages administratifs : aucun paiement n’est déclenché depuis ce parcours. Avant de modifier une formule, vérifiez les modules publics qui en dépendent afin d’éviter une disparition inattendue des horaires, traductions, réservations, événements ou galerie.

> Une vitrine active dépend de l’état de publication et de l’activité de l’établissement. Une formule ne remplace jamais les contrôles d’autorisation côté serveur.

## Administrer les propriétaires de manière sûre

L’onglet Propriétaires est conçu pour la supervision, non pour la lecture de secrets. Pour attribuer un nouvel accès, utilisez une invitation propriétaire. Les invitations stockent une empreinte de jeton et sont revendiquées de façon atomique ; le jeton brut ne doit pas être conservé dans un outil de suivi ou partagé en dehors du canal prévu.

Le transfert rattache un établissement à un propriétaire cible identifié dans l’annuaire. La dissociation retire l’association sans supprimer le compte. La suspension conserve les données et les établissements, mais invalide les sessions et bloque les nouvelles connexions jusqu’au rétablissement. Ces opérations doivent être confirmées avant leur exécution et utilisées uniquement après vérification de la demande métier.

| Action | Effet attendu | Point de vigilance |
|---|---|---|
| Inviter | Prépare un accès propriétaire temporaire | Transmettre le lien via un canal fiable. |
| Transférer | Change le propriétaire rattaché à un établissement | Vérifier l’identité et la continuité de gestion. |
| Dissocier | Retire un rattachement sans supprimer le compte | Prévoir le prochain propriétaire avant l’action. |
| Suspendre | Révoque les sessions et bloque les connexions | Conserver une trace interne de la raison. |
| Rétablir | Réautorise le compte | Confirmer que la cause de suspension est levée. |

## Vérifications avant publication

Utilisez l’aperçu administratif uniquement pour contrôler une vitrine. Les parcours propriétaires restent la source de vérité pour les modifications de contenu. Après une action Super Admin, vérifiez que la page publique concernée affiche l’état attendu et que les modules désactivés ne restent pas accessibles par URL directe.

Les notifications de réservation Email et WhatsApp ne sont pas activées tant qu’un fournisseur transactionnel et un fournisseur WhatsApp Business ne sont pas choisis puis configurés. Ne communiquez pas de promesse d’envoi avant cette activation.

## Ressources associées

Le [guide de démarrage propriétaire](./guide-demarrage-proprietaire.md) explique les opérations réalisées depuis le dashboard établissement. La [préparation des notifications de réservation](./2026-08-20-preparation-notifications-reservations.md) documente les prérequis externes restant à décider.
