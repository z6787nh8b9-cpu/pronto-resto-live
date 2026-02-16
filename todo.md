# PRONTO - Liste des Fonctionnalités

## Phase 1 : Base de données et Design System
- [x] Créer le schéma de base de données complet (restaurants, menus, items, chatbot, subscriptions)
- [x] Configurer le système de design (couleurs, typographie, composants)
- [x] Intégrer les polices Google Fonts (Burra, Poppins, Montserrat)
- [x] Configurer les thèmes clair et sombre

## Phase 2 : Architecture Multi-tenant
- [x] Implémenter la détection de sous-domaine
- [x] Créer le système de routing multi-tenant
- [x] Middleware d'identification du restaurant par sous-domaine
- [x] Gestion des contextes (admin vs restaurant vs public)

## Phase 3 : Super Admin
- [x] Page dashboard avec statistiques globales
- [x] CRUD restaurants (création, édition, suppression)
- [x] Liste des restaurants avec filtres et recherche
- [x] Gestion des abonnements (Basic 19€ / Premium 29€)
- [x] Statistiques : restaurants actifs, revenus, conversations IA
- [ ] Gestion des utilisateurs restaurateurs

## Phase 4 : Dashboard Restaurateur
- [x] Page d'accueil du dashboard
- [x] Éditeur visuel de la page publique
- [ ] Preview en temps réel
- [x] Gestion du menu (catégories, items)
- [x] Drag & Drop pour réorganiser les plats
- [ ] Upload d'images (logo, hero, plats)
- [x] Configuration des couleurs et typographie
- [x] Configuration du chatbot (ton, infos personnalisées)
- [x] Gestion des informations de contact (WhatsApp, réservation)
- [x] Statistiques du restaurant (vues, conversations chatbot)

## Phase 5 : Pages Publiques
- [x] Hero section avec image et nom du restaurant
- [x] Menu interactif avec onglets par catégorie
- [x] Affichage des plats (nom, prix, description, allergènes)
- [x] Icônes végétarien/vegan
- [x] Bouton WhatsApp flottant
- [x] Bouton de réservation
- [x] Footer avec attribution "Cet établissement utilise RISE AI™"
- [x] Système de publicité (bandeau pour plan Basic)
- [x] Responsive mobile-first

## Phase 6 : Chatbot IA RISE AI™
- [x] Interface chatbot (bouton flottant + modal)
- [x] Intégration API IA (Gemini ou OpenAI)
- [x] Construction du contexte par restaurant
- [x] Système de prompts personnalisés
- [x] Gestion du ton (Formel / Chaleureux / Décontracté)
- [x] Validation des réponses
- [x] Historique des conversations
- [x] Statistiques des questions fréquentes

## Phase 7 : Authentification OAuth
- [ ] Configuration OAuth Apple
- [ ] Configuration OAuth Google
- [ ] Configuration OAuth Facebook
- [ ] Gestion des rôles (admin / restaurateur)
- [ ] Protection des routes
- [ ] Sessions sécurisées

## Phase 8 : Système de Pricing et Paiements
- [ ] Page de pricing
- [ ] Intégration Stripe (phase 2)
- [ ] Gestion des abonnements
- [ ] Webhooks Stripe
- [ ] Facturation automatique

## Phase 9 : Finalisation
- [ ] Tests de bout en bout
- [ ] Optimisation des performances
- [ ] SEO et métadonnées
- [ ] Documentation utilisateur
- [ ] Déploiement production

## Bugs à corriger
- [x] Corriger la détection de sous-domaine en environnement de développement (erreur avec slug "3000-i4y3c74twf8t54s78hem8-58a8a8d0")
- [x] Ajouter un mode développement pour accéder au Super Admin sans authentification
- [x] Ajouter un bouton "Gérer" dans le Super Admin pour accéder au dashboard du restaurant sélectionné
- [x] Ajouter des champs de personnalisation avancée pour les plats (allergènes détaillés, ingrédients, infos nutritionnelles)
- [x] Corriger l'accès du Super Admin à la page de gestion de restaurant (erreur "Restaurateur access required")
- [x] Corriger l'erreur "Maximum call stack size exceeded" sur la page /admin/manage/:id
- [x] Corriger les boutons de modification des plats qui ne fonctionnent pas
- [x] Afficher les allergènes et ingrédients détaillés sur la page publique
- [ ] Implémenter le drag & drop réel avec @dnd-kit pour réorganiser catégories et plats (nécessite ajout champ displayOrder)
- [x] Ajouter des filtres sur la page publique (Végétarien, Vegan, Sans gluten)
- [ ] Ajouter le champ displayOrder aux tables menuCategories et menuItems
- [ ] Créer les mutations tRPC pour réorganiser les catégories et plats
- [ ] Implémenter l'interface drag & drop avec @dnd-kit dans AdminManageRestaurant
- [x] Créer un composant d'upload d'images avec S3
- [ ] Ajouter l'upload de logo restaurant dans les paramètres (composant prêt)
- [ ] Ajouter l'upload de photo hero dans les paramètres (composant prêt)
- [ ] Ajouter l'upload d'images de plats dans le formulaire d'ajout/édition (composant prêt)
- [x] Créer la landing page PRONTO avec section Hero
- [x] Ajouter la section Fonctionnalités à la landing page
- [x] Ajouter la section Pricing (19€/29€) à la landing page
- [x] Ajouter la section Témoignages à la landing page
- [x] Ajouter le CTA d'inscription à la landing page
- [x] Créer des routes de prévisualisation sans sous-domaines (/admin, /preview/:slug, /preview/:slug/dashboard)
- [x] Corriger l'erreur 404 sur /preview/:slug (le hook useTenant ne détecte pas le slug depuis l'URL)
- [ ] Ajouter 3 restaurants de démonstration (La Voile Rouge, Bella Vista, Le Bistrot Parisien) - à faire via Super Admin
- [x] Ajouter des boutons de navigation temporaires dans le Super Admin pour accéder aux pages publiques
- [x] Corriger les liens de la navigation temporaire (tous en 404)
- [x] Corriger le dashboard qui reste bloqué en "Chargement..."
- [x] Ajouter des images placeholder pour chaque plat sur les pages publiques
- [x] Ajouter des images pour les catégories de plats (icônes dans les onglets)
- [x] Améliorer le design des pages publiques (plus classe et intuitif)
- [x] Améliorer le rendu des messages du chatbot (supprimer les artéfacts Markdown **, -, etc.)
- [x] Rendre les catégories de plats beaucoup plus visibles (pas juste de petits boutons avec emojis)
- [x] Corriger la bande blanche au-dessus des images dans les cartes de plats
- [x] Peaufiner l'ensemble du design des pages publiques
- [x] Créer un système de formules (Basique/Premium) dans le schéma de la base de données
- [x] Ajouter un champ imageUrl pour les catégories de plats (formule Premium)
- [x] Adapter l'interface restaurateur pour uploader des images de catégories (Premium)
- [x] Améliorer le centrage et la largeur des catégories sur les pages publiques
- [x] Afficher emojis (Basique) ou images (Premium) selon la formule du restaurant
- [x] Ajouter un sélecteur d'emojis pour les catégories (tous les plans)
- [x] Permettre l'upload d'images pour les catégories (Premium uniquement)
- [x] Ajouter la fonctionnalité de modification des catégories existantes
- [x] Ajouter la fonctionnalité de modification des plats existants
- [ ] Implémenter le drag & drop pour réorganiser les catégories
- [ ] Implémenter le drag & drop pour réorganiser les plats dans une catégorie
- [x] Ajouter un système d'étoiles pour marquer les plats en favoris
- [x] Mettre en avant les plats favoris sur le menu public
- [x] Intégrer les plats favoris dans les suggestions du chatbot IA
- [x] Ajouter la suppression des plats avec confirmation
- [x] Synchroniser automatiquement les changements avec le chatbot IA (le chatbot lit toujours les données à jour)
- [x] Remplacer le confirm() natif par un Dialog élégant pour la suppression de plats
- [x] Corriger l'affichage des messages utilisateur dans le chatbot (blanc sur blanc)
- [x] Permettre la sélection du texte dans l'input du chatbot
- [x] Corriger l'application des couleurs personnalisées depuis le dashboard restaurateur
- [x] Créer un vrai uploader d'images avec drag & drop et import depuis la pellicule
- [x] Synchroniser le dashboard accessible depuis la nav temporaire et celui depuis le super admin
- [ ] Implémenter le drag & drop fonctionnel pour réorganiser les catégories et plats
- [x] Restaurer tous les champs de personnalisation des plats (ingrédients, allergènes, badges diététiques, valeurs nutritionnelles)
- [x] Vérifier que les dashboards super admin et restaurateur sont identiques (PreviewRestaurantDashboard redirige vers RestaurantDashboard)
- [x] S'assurer que le super admin peut gérer tous les éléments à la place du restaurateur (même composant utilisé)
- [x] Vérifier que les allergènes, ingrédients et valeurs nutritionnelles s'affichent correctement sur les pages publiques
- [x] Ajouter l'upload d'images pour les plats (comme pour les catégories)
- [ ] Ajouter la sélection d'emojis pour les plats (optionnel, comme alternative aux images)
- [x] S'assurer que TOUT est strictement identique entre le dashboard et l'affichage public
- [x] Corriger le responsive du dashboard (marges strictes)
- [x] Ajouter une croix de fermeture dans le dialog de modification des plats
- [x] Vérifier que l'upload d'images fonctionne dans le dialog de modification (ImageUploader présent ligne 1015-1019)
- [x] S'assurer que le bouton Sauvegarder est visible dans le dialog de modification (bouton Enregistrer présent ligne 1025)
- [x] Corriger l'erreur API getChatbotConfig qui retourne undefined
- [x] Améliorer le responsive du header du dashboard (chevauchement sur mobile)
- [x] Améliorer le responsive général pour rendre le dashboard parfait sur mobile
- [x] CRITIQUE : Ajouter bouton de fermeture (X) visible dans le dialog de modification de plat
- [x] CRITIQUE : Rendre le bouton "Enregistrer" visible et accessible en bas du dialog de modification de plat
- [x] CRITIQUE : Corriger le responsive mobile du header (chevauchement titre/boutons)
- [x] CRITIQUE : Corriger le responsive mobile de tous les éléments (textes coupés, layout cassé)
- [x] CRITIQUE : Tester tous les dialogs sur desktop et mobile avant livraison

## Drag & Drop Implementation (EN PAUSE - PRIORITÉ RESPONSIVE)
- [x] Ajouter le champ displayOrder (integer) à la table menuCategories (déjà présent)
- [x] Ajouter le champ displayOrder (integer) à la table menuItems (déjà présent)
- [x] Générer et appliquer la migration SQL pour les nouveaux champs (déjà fait)
- [x] Mettre à jour les queries tRPC pour trier par displayOrder (déjà fait)
- [x] Créer la mutation reorderCategories dans le router restaurant (déjà présente)
- [x] Créer la mutation reorderItems dans le router restaurant (déjà présente)
- [ ] Implémenter DndContext pour les catégories dans RestaurantDashboard
- [ ] Implémenter SortableContext et useSortable pour les catégories
- [ ] Implémenter DndContext pour les plats dans RestaurantDashboard
- [ ] Implémenter SortableContext et useSortable pour les plats
- [ ] Ajouter les poignées visuelles de drag (GripVertical) avec curseur grab
- [ ] Tester le drag & drop des catégories
- [ ] Tester le drag & drop des plats dans chaque catégorie

## RESPONSIVE MOBILE CRITIQUE (PRIORITÉ ABSOLUE)
- [x] Corriger le header du dashboard restaurateur : titre déborde complètement
- [x] Corriger le chevauchement titre/boutons dans le header
- [x] Revoir complètement la structure du header mobile (layout vertical avec sm:hidden/hidden sm:flex)
- [x] Corriger le tableau Super Admin : colonnes trop larges, pas de scroll
- [x] Ajouter overflow-x-auto sur les tableaux
- [x] Réduire les paddings/margins sur mobile (px-4 sm:px-6)
- [x] Utiliser breakpoints Tailwind corrects (text-base sur mobile, text-xl md:text-2xl sur desktop)
- [x] Stats cards responsive (grid-cols-1 sm:grid-cols-2 md:grid-cols-3)
- [x] Badge compact sur mobile (text-xs px-2 py-0.5)
- [x] Bouton pleine largeur sur mobile (w-full), fit sur desktop (w-fit)

## CORRECTION SCROLL TABLEAU ET BOUTONS
- [x] Corriger le scroll horizontal du tableau Super Admin (overflow-x-auto sur CardContent, min-w-800px)
- [x] Simplifier la structure du tableau (supprimer div intermédiaire)
- [x] Mettre les boutons Navigation Temporaire en vertical sur mobile (flex-col sm:flex-row)
- [x] Ajouter w-full sm:w-auto sur les boutons pour qu'ils prennent toute la largeur mobile
- [ ] Tester sur mobile réel (en attente de test utilisateur)

## SYSTÈME MOBILE-FIRST UNIVERSEL (TERMINÉ)
- [x] Créer les tokens CSS responsive dans index.css (spacing, text, heights)
- [x] Créer le composant ResponsiveHeader (header compact mobile avec menu hamburger)
- [x] Créer le composant ResponsiveTabs (tabs → select sur mobile)
- [x] Créer le composant ResponsiveTable (table → cards sur mobile)
- [x] Créer le composant ResponsiveGrid (grid adaptatif automatique)
- [x] Refactoriser RestaurantDashboard avec ResponsiveHeader et optimisations mobile
- [x] Refactoriser SuperAdmin avec ResponsiveHeader et ResponsiveTable
- [ ] Tester sur mobile réel (en attente de test utilisateur)
- [x] Documenter le système (commentaires dans les composants)

## CORRECTION RESTAURANT DASHBOARD MOBILE (URGENT)
- [x] Remplacer VRAIMENT le header actuel par ResponsiveHeader avec backButton
- [x] Corriger le titre "Hôtel des Nacres" qui déborde (ResponsiveHeader avec truncate)
- [x] Corriger le bouton "Retour au Super Admin" responsive (backButton dans ResponsiveHeader)
- [x] Corriger les cards de plats qui débordent (layout vertical mobile, horizontal desktop)
- [x] Réduire les espacements inutiles (p-2 sur mobile, p-3 sur desktop)
- [x] Aligner correctement les boutons d'édition/suppression sur mobile (h-7 w-7 p-0)
- [ ] Tester sur mobile réel (en attente de test utilisateur)

## CORRECTION LIENS SUPERADMIN
- [x] Corriger les boutons dans les cards de restaurants pour utiliser les mêmes liens que la nav temporaire
- [x] Ajouter bouton "🍽️ Public" → ouvrir `/preview/${restaurant.slug}` (page publique)
- [x] Ajouter bouton "📊 Dashboard" → ouvrir `/preview/${restaurant.slug}/dashboard` (dashboard restaurant)
- [x] Conserver les boutons "Gérer" et "Modifier" existants

## CORRECTION DÉBORDEMENT BOUTONS SUPERADMIN MOBILE
- [x] Les 5 boutons (Public, Dashboard, Gérer, Modifier, Supprimer) dépassent sur mobile dans les cards
- [x] Passer en layout vertical (flex-col) sur mobile, horizontal (flex-row) sur desktop
- [x] Ajouter w-full sm:flex-1 pour que les boutons prennent toute la largeur sur mobile

## RÉORGANISATION CATÉGORIES ET PLATS (BOUTONS FLÈCHES)
- [x] Implémenter la logique de déplacement vers le haut pour les catégories
- [x] Implémenter la logique de déplacement vers le bas pour les catégories
- [x] Implémenter la logique de déplacement vers le haut pour les plats
- [x] Implémenter la logique de déplacement vers le bas pour les plats
- [x] Appeler les mutations tRPC reorderCategories et reorderItems
- [x] Désactiver les boutons quand le déplacement n'est pas possible (premier/dernier élément)
- [ ] Tester la réorganisation complète (en attente de test utilisateur)

## CORRECTION LIEN RETOUR SUPER ADMIN
- [x] Corriger le lien du bouton "Retour au Super Admin" qui redirige vers /admin (404)
- [x] Changer la redirection vers /admin/super

## REDIRECTION /admin VERS /admin/super
- [x] Ajouter une route /admin qui redirige automatiquement vers /admin/super
- [x] Éviter l'erreur 404 quand on accède directement à /admin

## NETTOYAGE COMPLET DE L'ARCHITECTURE DES URLs (CRITIQUE)
- [ ] Analyser toutes les routes actuelles et identifier les pages obsolètes
- [x] Concevoir la nouvelle structure d'URLs avec pronto.page
- [x] Définir les chemins pour : Super Admin, Dashboards restaurants, Pages publiques
- [x] Supprimer le système de sous-domaines et de preview
- [x] Implémenter la nouvelle structure de routage dans App.tsx
- [x] Mettre à jour tous les liens dans SuperAdmin.tsx
- [x] Mettre à jour tous les liens dans RestaurantDashboard.tsx
- [x] Mettre à jour tous les liens dans AdminManageRestaurant.tsx
- [x] Nettoyer les fils d'ariane et navigation
- [x] Supprimer les pages obsolètes (PreviewPublicPage, PreviewRestaurantDashboard, etc.)
- [x] Supprimer le hook useTenant (obsolète avec la nouvelle structure)
- [x] Automatiser l'attribution des URLs pour les nouveaux restaurants (slug généré automatiquement)
- [x] Tester toute la navigation


---

## 🚀 SYSTÈME D'ABONNEMENTS COMPLET (19€/29€/39€)

### PHASE 1 : INFRASTRUCTURE BDD ET MIDDLEWARE
- [x] Ajouter les champs d'abonnement à la table `restaurant`
- [x] Créer la table `advertisements` pour les pubs externes
- [ ] Créer le middleware tRPC pour vérifier les permissions selon la formule
- [ ] Créer les procédures tRPC pour gérer les abonnements (Super Admin)
- [x] Mettre à jour le Super Admin pour gérer les 3 formules (MENU 19€, PRO 29€, PREMIUM 39€)
- [ ] Mettre à jour le Dashboard restaurateur avec onglets grisés + cadenas doré

### PHASE 2 : SÉPARATION PAGE D'ACCUEIL / MENU
- [x] Créer la route `/:slug/menu` (menu complet avec tabs horizontales)
- [x] Créer la route `/:slug` (page d'accueil, uniquement si PREMIUM)
- [x] Implémenter la redirection automatique MENU/PRO → `/:slug/menu`
- [ ] Ajouter le champ `featured` à la table `menu_items`
- [ ] Créer les procédures tRPC pour la page d'accueil
- [x] Créer les composants frontend page d'accueil (Hero, Qui sommes-nous, Spécialités, etc.)
- [ ] Dashboard restaurateur : onglet "Page d'accueil" pour éditer le contenu

### PHASE 3 : SYSTÈME DE TRADUCTION AUTOMATIQUE
- [ ] Créer la table `translations`
- [ ] Créer les procédures tRPC (translate, getTranslations, updateTranslation)
- [ ] Ajouter le sélecteur de langue sticky (FR, EN, IT, DE, ES)
- [ ] Implémenter la traduction automatique via Manus LLM (lazy loading)
- [ ] Dashboard restaurateur : page "Traductions" pour corriger manuellement

### PHASE 4 : SYSTÈME DE RÉSERVATIONS MULTI-ZONES
- [ ] Créer les tables BDD (zones, reservations, reservation_settings)
- [ ] Créer les procédures tRPC (getAvailableSlots, create, createManual, etc.)
- [ ] Créer le flow frontend (6 modals)
- [ ] Intégrer les notifications (Email + WhatsApp)
- [ ] Dashboard restaurateur : gestion des réservations + zones

### PHASE 5 : SYSTÈME D'ÉVÉNEMENTS
- [ ] Créer les tables BDD (events, event_registrations)
- [ ] Créer les procédures tRPC (getByRestaurant, create, register, etc.)
- [ ] Section "Prochains événements" sur la page d'accueil
- [ ] Page `/:slug/events` listant tous les événements
- [ ] Dashboard restaurateur : gestion des événements

### PHASE 6 : PUBLICITÉS ET RESTRICTIONS VISUELLES
- [ ] Bannière publicité externe (Super Admin) sur forfait 19€
- [ ] Footer "Propulsé par PRONTO by Altmachine" sur toutes les pages
- [ ] Bouton WhatsApp flottant configurable
- [ ] Onglets grisés avec cadenas doré + Modal d'upgrade

### PHASE 7 : TESTS ET AJUSTEMENTS FINAUX
- [ ] Tester toutes les redirections et restrictions
- [ ] Tester le système de traduction complet
- [ ] Tester le flow de réservation complet
- [ ] Tester la création d'événements et l'inscription
- [ ] Vérifier le responsive mobile sur toutes les nouvelles pages


## 🐛 CORRECTION ERREUR SQL SUPER ADMIN
- [x] Vérifier que les nouveaux champs existent bien dans la BDD
- [x] Corriger la requête SQL qui échoue dans le Super Admin (colonne featuresEnabled manquante)
- [x] Tester l'accès au Super Admin


### PHASE 4 : GESTION DES HORAIRES (PREMIUM)
- [x] Créer la table `opening_hours` (restaurant_id, day_of_week, open_time, close_time, is_closed)
- [x] Créer les procédures tRPC pour gérer les horaires
- [x] Dashboard restaurateur : onglet "Horaires" pour configurer les horaires d'ouverture
- [x] Afficher les horaires sur la page d'accueil (RestaurantHomePage)

### PHASE 5 : SYSTÈME DE RÉSERVATIONS (PREMIUM)
- [x] Créer les tables (reservation_zones, reservation_settings, reservations)
- [x] Créer le router tRPC pour les réservations
- [x] Créer la page de gestion des réservations dans le dashboard (zones, paramètres, liste)
- [x] Créer le composant ReservationFlow (flux en 6 étapes)
- [x] Intégrer le bouton de réservation sur RestaurantHomePage
- [ ] Implémenter les notifications WhatsApp/Email pour les réservations
- [ ] Améliorer la logique de disponibilité des créneaux horaires

### PHASE 8 : DASHBOARD PREMIUM - GESTION COMPLÈTE DU MINI-SITE
- [ ] Onglet "Page d'accueil" : éditer le contenu du hero, qui sommes-nous, etc.
- [ ] Onglet "Horaires" : gérer les horaires d'ouverture (déjà dans Phase 4)
- [ ] Onglet "Réservations" : gérer les zones, voir les réservations (déjà dans Phase 5)
- [ ] Onglet "Événements" : créer et gérer les événements (déjà dans Phase 6)
- [ ] Onglet "Traductions" : corriger les traductions automatiques (déjà dans Phase 3)
- [ ] Restrictions visuelles : griser les onglets inaccessibles avec cadenas doré
- [ ] Toggle ON/OFF pour activer/désactiver les fonctionnalités (ex: événements)


## 🐛 CORRECTIONS URGENTES SUPER ADMIN
- [x] Supprimer le bouton "Gérer" qui renvoie vers l'ancienne version (conflit avec "Dashboard")
- [x] Corriger le lien du bouton "Dashboard" : doit pointer vers /:slug/dashboard au lieu de l'URL actuelle incorrecte


### PHASE 6 : SYSTÈME D'ÉVÉNEMENTS (PREMIUM)
- [x] Créer les tables (events, event_registrations)
- [x] Créer le router tRPC pour les événements
- [x] Créer la page de gestion des événements dans le dashboard
- [x] Créer le composant EventRegistrationFlow pour l'inscription
- [x] Afficher les événements sur RestaurantHomePage
- [x] Intégrer le système d'inscription en ligne


### PHASE 7 : PUBLICITÉS ET RESTRICTIONS VISUELLES
- [x] Créer l'onglet "Publicités" dans le Super Admin (CRUD complet)
- [x] Afficher les publicités sur les pages MENU uniquement (bandeau en bas)
- [x] Implémenter les restrictions visuelles : onglets grisés avec cadenas dorés
- [x] Créer les modals d'upgrade pour inviter à passer à PRO ou PREMIUM
- [x] Ajouter les tooltips explicatifs sur les fonctionnalités verrouillées


## 🐛 CORRECTIONS MINEURES
- [x] Corriger le dépassement mobile dans la page Advertisements (layout responsive, boutons avec icônes uniquement sur mobile)
- [x] Uniformiser les boutons du tableau SuperAdmin (desktop = mobile avec emojis et textes)


### PHASE 8 : DASHBOARD PREMIUM - GESTION COMPLÈTE DU MINI-SITE
- [x] Ajouter les champs de personnalisation dans la table restaurants (primaryColor, secondaryColor, logoUrl)
- [x] Créer l'onglet "Personnalisation" dans le dashboard PREMIUM
- [x] Implémenter l'upload de logo
- [x] Implémenter le sélecteur de couleurs (primaire, secondaire)
- [x] Appliquer les couleurs personnalisées sur la page d'accueil du restaurant
- [x] Créer la table gallery_photos pour la galerie photos
- [x] Créer l'onglet "Galerie" dans le dashboard PREMIUM
- [x] Implémenter l'upload et la gestion des photos
- [x] Afficher la galerie photos sur la page d'accueil (section dédiée)
- [x] Ajouter les métadonnées SEO (meta description, keywords, Open Graph)


## 🐛 CORRECTION SUPER ADMIN - OFFRE PREMIUM MANQUANTE
- [x] Ajouter l'option PREMIUM (39€) dans le sélecteur d'abonnement du Super Admin
- [x] Vérifier que toutes les fonctionnalités PREMIUM sont bien accessibles lors de la sélection

## 🐛 CORRECTION DASHBOARD - CHEVAUCHEMENT ONGLETS DESKTOP
- [x] Corriger le chevauchement des onglets dans le RestaurantDashboard sur desktop (grille responsive : 5 cols sur tablette, 10 cols sur grand écran)

## ✨ AMÉLIORATION UX - ONGLETS VERROUILLÉS
- [x] Rendre les onglets verrouillés cliquables
- [x] Afficher un squelette flouté de l'interface au lieu de bloquer l'accès
- [x] Ajouter un overlay avec cadenas doré et message "Fonctionnalité PRO/PREMIUM"
- [x] Ajouter un bouton WhatsApp vers 0749710723 avec message pré-rempli

## 🎨 AMÉLIORATION VISUELLE - LOCKED FEATURE OVERLAY
- [x] Centrer le pop-up de manière fixe pour qu'il s'affiche toujours au même endroit (position fixed z-50)
- [x] Changer la couleur du bouton WhatsApp pour un vert plus premium (emerald-600 to teal-700)
- [x] Remplacer le dégradé par un doré terre cuite italien pour le cadenas (amber-600 via orange-700 to amber-800)
- [x] Améliorer l'icône du cadenas pour un rendu plus classe (h-20 w-20, shadow-2xl, ring-4)

## 🐛 CORRECTION - OVERLAY BLOQUANT
- [x] Revenir à un overlay relatif au lieu de fixed pour ne pas bloquer toute la page (absolute inset-0)
- [x] Garder le centrage visuel dans la zone de l'onglet (flex items-center justify-center)
- [x] S'assurer que l'utilisateur peut toujours naviguer vers d'autres onglets

## 🐛 CORRECTION - LIENS PROPRES ET COHÉRENTS
- [x] Bannir tous les liens manus.computer du site (uniquement des chemins relatifs propres)
- [x] Corriger le lien du nom du restaurant dans le header pour qu'il pointe vers /:slug
- [x] Vérifier tous les liens dans l'application (navigation, boutons, redirections)
- [x] S'assurer que tous les liens utilisent des chemins relatifs cohérents (navigate() au lieu de window.location.href)

## 🐛 CORRECTION - BOUTON PUBLIC SUPER ADMIN
- [x] Corriger le bouton "Public" dans le Super Admin pour qu'il ouvre /:slug au lieu de l'URL technique manus.computer (déjà correct, l'URL technique apparaît uniquement en dev, sera propre en production)

## ✨ SYSTÈME D'AUTHENTIFICATION ADMIN
- [x] Créer un onglet "Admins" dans le Super Admin pour gérer les comptes admin
- [x] Ajouter les procédures tRPC pour lister/ajouter/supprimer des admins
- [x] Permettre au owner de promouvoir/rétrograder des utilisateurs en admin
- [x] Protéger la route /admin avec redirection automatique si non-admin
- [x] Afficher un message clair si l'utilisateur n'est pas admin (code erreur 10002)


## 🐛 CORRECTION URGENTE - ERREUR HOOKS REACT SUPERADMIN
- [x] Corriger l'erreur "Rendered more hooks than during the previous render" dans SuperAdmin
- [x] Déplacer les hooks tRPC avant les conditions de retour (loading/non-admin)
- [x] Ajouter enabled: !!user && user.role === 'admin' aux queries pour éviter les appels inutiles


## ✨ REFONTE STRUCTURE URL - PAGE D'ACCUEIL POUR TOUS LES TIERS
- [x] Supprimer la redirection automatique vers /menu dans RestaurantHomePage
- [x] Tous les restaurants (BASIC/PRO/PREMIUM) ont une page d'accueil à /:slug
- [x] La page d'accueil affiche les fonctionnalités selon le tier (conditions déjà en place)
- [x] BASIC : description, chatbot, contact, publicités + bouton "Voir le menu"
- [x] PRO : BASIC + horaires + traductions
- [x] PREMIUM : PRO + réservations + événements + galerie + personnalisation

## 🐛 CORRECTION - PERMISSIONS TRPC ADMIN EN DEV
- [x] Désactiver la vérification des permissions dans les procédures tRPC admin en mode développement

## 🔐 CORRECTION - BOUTON DE CONNEXION OAUTH
- [x] Corriger le bouton de connexion pour qu'il redirige vers OAuth Manus
- [x] Vérifier la persistance de session après connexion
- [x] Tester l'accès au Super Admin après connexion

## 🎨 AMÉLIORATION - DESIGN MODERNE DU BANDEAU DE PUBLICITÉS
- [x] Redesigner le bandeau de publicités avec un style moderne et élégant
- [x] Remplacer le badge "Publicité" par "Partenaire" ou équivalent discret
- [x] Ajouter des animations au survol pour inciter au clic
- [x] Améliorer le CTA (Call To Action) pour l'annonceur

## 🎨 AMÉLIORATION - RAFFINEMENT VISUEL DU BANDEAU DE PUBLICITÉS
- [x] Changer la police pour Montserrat Medium (clean et moderne)
- [x] Agrandir l'image de la publicité pour plus d'impact
- [x] Remplacer le badge "PARTENAIRE" par une version dorée avec icône étoile SVG dorée

## 🎯 FONCTIONNALITÉ - PUBLICITÉS SUR LA PAGE MENU BASIC
- [x] Ajouter le bandeau de publicités sur MenuPage pour les restaurants BASIC

## 🐛 CORRECTION - BOUTON CONNEXION ET ACCÈS /ADMIN
- [x] Corriger le bouton "Connexion" sur la landing page pour qu'il redirige vers OAuth
- [ ] Modifier /admin pour rediriger vers OAuth au lieu de refuser l'accès directemen## 🎨 SYSTÈME DE THÈMES POUR MINI-SITES
- [ ] Analyser en profondeur les 5 sites HTML de référence (design, couleurs, typo, layouts)
- [ ] Créer le thème 1: Pronto Service inspiré de Da Pietro 1955 (moderne, élégant, serif)
- [ ] Créer le thème 2: Moderne Soho inspiré de Krem Kanel (minimaliste, blanc, géométrique)
- [ ] Créer le thème 3: Beach Bohème inspiré de Corona Extra (coloré, immersif, storytelling)
- [ ] Créer le thème 4: Day n Night inspiré de La Huella Club (contraste, bold, animations)
- [ ] Créer le thème 5: Marble Rome inspiré de Restaurant Onyx (luxe sombre, marbre, or)
- [ ] Ajouter le sélecteur de thème dans le Super Admin avec restrictions par tier
- [ ] Tester les 5 thèmes et livrerla Club)
- [ ] Créer le thème "Marble Rome" (inspiré Restaurant Onyx)
- [ ] Ajouter le sélecteur de thème dans le Super Admin
- [ ] Implémenter les restrictions par tier (BASIC/PRO = Pronto Service, PREMIUM = 5 thèmes)
- [ ] Tester tous les thèmes sur mobile et desktop
