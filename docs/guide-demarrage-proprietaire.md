# Guide de démarrage propriétaire

## Accéder à votre espace

Votre espace de gestion se trouve à l’adresse `https://pronto.page/<votre-slug>/dashboard`. La connexion passe par [la page propriétaire](https://pronto.page/login-restaurant). Après validation de vos accès, PRONTO ouvre le dashboard de l’établissement auquel votre compte est rattaché.

> Ne transmettez jamais votre mot de passe ou un lien de réinitialisation. Les demandes d’accès sont traitées via les invitations propriétaires ou le parcours de récupération de mot de passe.

| Besoin | Adresse ou action |
|---|---|
| Se connecter | `/login-restaurant` |
| Réinitialiser un mot de passe | Depuis la page de connexion, puis via le lien à usage unique reçu |
| Gérer la vitrine | `/<votre-slug>/dashboard` |
| Voir la page publique | `/<votre-slug>` |
| Voir le catalogue public | `/<votre-slug>/menu` |
| Voir les événements publics | `/<votre-slug>/events` |

## Publier une vitrine cohérente

Commencez par les paramètres de l’établissement. Renseignez le nom, les coordonnées utiles, le lien WhatsApp, ainsi que votre logo et votre image de couverture. Un numéro WhatsApp est normalisé avant publication : s’il est incomplet ou invalide, le bouton public reste volontairement masqué.

Le catalogue est ensuite votre source de vérité. Créez vos collections, ajoutez les produits, plats ou prestations, puis complétez si nécessaire la description, le prix, les informations alimentaires, l’image et le statut de spécialité. Les catégories et éléments peuvent être réorganisés par glisser-déposer, par clavier ou avec les commandes de déplacement. L’ordre choisi est celui de la vitrine publique.

| Contenu | Où le gérer | Effet public |
|---|---|---|
| Nom, description et contact | Paramètres | Hero, coordonnées et contact direct |
| Logo et couverture | Paramètres | Identité visuelle de la vitrine |
| Collections et éléments | Catalogue | Catalogue et menu public |
| Spécialités | Catalogue | Mise en avant factuelle sur la vitrine |
| Chatbot | Chatbot | Déclencheur public et contexte de réponse |
| Page d’accueil | Onglet Page d’accueil | Titre, accroche et présentation éditoriale |

## Utiliser l’aperçu public

Le bouton d’aperçu ouvre une version isolée de votre vitrine. Les modifications sauvegardées actualisent cet aperçu automatiquement. Dans l’éditeur Premium de page d’accueil, le titre, l’accroche et la présentation se reflètent également pendant la saisie afin de faciliter la relecture avant publication.

L’aperçu reste un outil de vérification. Après une modification importante, consultez aussi l’URL publique de l’établissement dans un nouvel onglet, notamment pour contrôler le rendu mobile, les liens de contact et l’ordre du catalogue.

## Fonctions disponibles selon votre formule

Les accès du dashboard sont contrôlés côté serveur. Une section verrouillée ne permet pas d’effectuer de mutation, même si son interface est consultable comme aperçu. Le Super Admin peut adapter la formule et le statut de l’établissement depuis son espace de gestion.

| Niveau | Fonctions principales |
|---|---|
| Menu | Vitrine, catalogue, coordonnées, chatbot et mise en avant limitée de spécialités |
| Pro | Fonctions Menu, horaires et traductions publiques |
| Premium | Fonctions Pro, page d’accueil éditoriale, galerie, réservations, événements et thèmes de vitrine |

Les modules Réservations et Événements peuvent être désactivés depuis le dashboard Premium. Une désactivation retire les parcours publics associés : créneaux, formulaires et listes ne restent pas accessibles par simple URL.

## Réservations et événements

Les réservations s’appuient sur vos zones, vos capacités et vos horaires. Avant d’ouvrir ce module au public, configurez les zones utilisables et vérifiez les créneaux proposés. Une disponibilité est calculée par zone ; elle ne combine pas les capacités d’espaces distincts.

Les événements sont gérés dans l’onglet dédié. Une fois publiés et activés, ils apparaissent dans la vitrine et sur la page `/<votre-slug>/events`. Les inscriptions publiques sont filtrées par visibilité, date, capacité et état actif de l’établissement.

> Les notifications Email et WhatsApp de réservation ne constituent pas encore un canal de confirmation configuré. Le dashboard enregistre les réservations, mais aucune promesse d’envoi ne doit être communiquée avant l’activation d’un fournisseur de messagerie.

## Bonnes pratiques de publication

Avant de partager votre lien, vérifiez que chaque prix et chaque description est à jour, que les images correspondent au bon élément et que les coordonnées de contact sont correctes. Utilisez l’aperçu à chaque étape structurante, puis vérifiez la page publique sur mobile.

Évitez de stocker des informations sensibles dans les descriptions ou le chatbot. Les informations présentées publiquement doivent être exactes, nécessaires à la clientèle et compatibles avec votre politique de confidentialité.
