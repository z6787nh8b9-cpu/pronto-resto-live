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

## 🚨 CORRECTION URGENTE - SYSTÈME DE THÈMES NE S'APPLIQUE PAS

- [x] Analyser pourquoi les CSS des thèmes ne s'appliquent pas (classes CSS vs classes Tailwind)
- [x] Refondre RestaurantHomePage pour utiliser les classes CSS des thèmes au lieu de Tailwind
- [x] Corriger le mismatch entre les noms de classes HTML et CSS
- [x] Importer statiquement tous les CSS de thèmes dans index.css
- [x] Créer le CSS complet pour le thème Pronto Service avec toutes les classes nécessaires
- [x] Tester le thème Pronto Service visuellement (fonctionne correctement)
- [ ] Finaliser les 4 autres thèmes (Moderne Soho, Beach Bohème, Day n Night, Marble Rome)
- [ ] Refondre RestaurantMenuPage pour utiliser les classes CSS des thèmes
- [ ] Vérifier le responsive mobile pour chaque thème

## 🎨 MODERNISATION DU DESIGN DES PAGES PUBLIQUES

- [ ] Créer une palette de couleurs moderne (noir/blanc/gris + accent doré/terracotta)
- [ ] Ajouter des variables CSS globales pour le nouveau design
- [ ] Refondre RestaurantHomePage avec design moderne et épuré
- [ ] Améliorer les cards de plats avec hover effects et meilleure intégration d'images
- [ ] Refondre RestaurantMenuPage avec le même design
- [ ] Optimiser le responsive mobile
- [ ] Tester sur plusieurs restaurants

## ✨ FONCTIONNALITÉ - Auto-traduction avec LLM

- [x] Créer une mutation tRPC pour l'auto-traduction avec LLM (autoTranslatePublic)
- [x] Modifier useTranslation pour déclencher l'auto-traduction automatiquement
- [x] Implémenter la traduction automatique du restaurant, catégories et plats
- [x] Tester l'auto-traduction avec l'anglais (fonctionne correctement)

## 🚨 RESTAURATION FONCTIONNALITÉS PERDUES (URGENT)

- [ ] Restaurer les flèches de déplacement (↑↓) pour réorganiser les catégories dans le dashboard
- [ ] Restaurer les flèches de déplacement (↑↓) pour réorganiser les plats dans le dashboard
- [ ] Restaurer la section Événements sur RestaurantHomePage
- [ ] Restaurer la section Horaires d'ouverture sur RestaurantHomePage
- [ ] Restaurer la section Réservations sur RestaurantHomePage
- [x] Restauré les stats de vues et conversations dans le dashboard via un agrégat serveur isolé
- [x] Contrôlé le toggle de désactivation du chatbot déjà présent dans le dashboard et protégé par la mutation propriétaire/Super Admin
- [x] Contrôlé la configuration des zones, capacités, tables et créneaux déjà disponible dans le dashboard
- [ ] Implémenter la limitation des favoris selon la formule (Basic: 1, Pro: 3, Premium: 5)
- [ ] Ajouter une bulle info quand l'utilisateur atteint la limite de favoris
- [ ] Restaurer la mise en avant visuelle des favoris sur la page publique (étoile dorée + badge)
- [ ] Intégrer subtilement les favoris dans les suggestions du chatbot IA

## 🔐 SYSTÈME D'AUTHENTIFICATION OAUTH (EN COURS)

### Phase 1 : Configuration OAuth et table d'invitations
- [ ] Ajouter les credentials OAuth Google et Facebook aux secrets
- [x] Créer la table `invitations` dans le schéma Drizzle
- [x] Ajouter le champ `ownerId` à la table `restaurants`
- [x] Générer et appliquer la migration SQL

### Phase 2 : Routes OAuth
- [x] Créer les routes `/api/auth/google` et `/api/auth/google/callback`
- [x] Créer les routes `/api/auth/facebook` et `/api/auth/facebook/callback`
- [x] Implémenter la logique de création/association des users

### Phase 3 : Système d'invitations
- [x] Créer la mutation tRPC `createInvitation` (Super Admin)
- [x] Créer la mutation tRPC `acceptInvitation` (public)
- [x] Créer la page `/invite/[token]`
- [x] Implémenter l'expiration automatique (24h)

### Phase 4 : Protection des dashboards
- [x] Créer le middleware `protectedRestaurantProcedure`
- [x] Vérifier que `user.restaurantId === restaurant.id`
- [x] Autoriser les Super Admins à accéder à tous les dashboards

### Phase 5 : Page de login
- [ ] Créer la page `/login` avec boutons OAuth
- [ ] Implémenter la redirection après connexion
- [ ] Gérer les erreurs (compte non trouvé, etc.)

### Phase 6 : Tests
- [x] Tester le flux complet d'invitation
- [ ] Tester la connexion Google et Facebook
- [x] Tester la protection des dashboards
- [x] Vérifier que les Super Admins peuvent accéder à tout


## 🔐 SYSTÈME D'AUTHENTIFICATION RESTAURATEURS (OAuth Google/Facebook)

### PHASE 1 & 2 : Base de données et Login (TERMINÉ)
- [x] Créer table `restaurant_owners` en base de données (séparée de `users`)
- [x] Créer table `invitations` en base de données avec token unique et expiration 24h
- [x] Installer et configurer Passport.js avec Google et Facebook OAuth
- [x] Créer page `/login-restaurant` avec boutons OAuth Google et Facebook
- [x] Modifier bouton "Connexion" de la landing page pour rediriger vers `/login-restaurant`
- [x] Remplacer logo carré par le vrai logo PRONTO

### PHASE 3 : Système d'invitations (TERMINÉ)
- [x] Créer procédure tRPC `invitations.create` (Super Admin uniquement)
- [x] Générer token unique (UUID v4) avec expiration 24h
- [x] Ajouter bouton "Inviter propriétaire" dans le Super Admin pour chaque restaurant
- [x] Afficher le lien d'invitation généré (copier dans le presse-papier)
- [x] Gérer l'expiration automatique des invitations

### PHASE 4 : Acceptation d'invitation (TERMINÉ)
- [x] Créer page `/invite/:token` pour accepter les invitations
- [x] Vérifier la validité du token (existe, non utilisé, non expiré)
- [x] Rediriger vers `/login-restaurant?token=XXX` si valide
- [x] Afficher erreur si token invalide/expiré
- [x] Associer le restaurant au propriétaire après OAuth réussi

### PHASE 5 : Protection des dashboards (TERMINÉ)
- [x] Créer middleware `requireRestaurantOwner` pour vérifier l'authentification
- [x] Vérifier que `req.user.id === restaurant.ownerId` avant d'accéder au dashboard
- [x] Permettre aux Super Admins (Manus OAuth) d'accéder à tous les dashboards
- [x] Rediriger vers `/login-restaurant` si non authentifié
- [x] Afficher message d'erreur si le restaurateur tente d'accéder à un autre restaurant

### PHASE 6 : Tests et finalisation (TERMINÉ)
- [x] Tester le flux complet d'invitation
- [x] Tester l'authentification Google OAuth
- [x] Tester l'authentification Facebook OAuth
- [x] Vérifier la protection des dashboards
- [x] Créer checkpoint finalin à tous les restaurants
- [ ] Checkpoint final avec toutes les fonctionnalités

## 🎨 BRANDING - Remplacement du logo
- [x] Copier le nouveau logo horizontal dans le dossier public
- [x] Remplacer le logo dans LandingPage.tsx
- [x] Vérifier l'affichage responsive du nouveau logo

## 🔧 UX - Séparation invitations et restaurants
- [x] Créer procédure tRPC pour lister toutes les invitations (tous restaurants confondus)
- [x] Ajouter section "Invitations" séparée dans SuperAdmin
- [x] Afficher statut, restaurant, date création, date expiration pour chaque invitation
- [x] Garder bouton "Inviter" sur chaque ligne du tableau restaurants

## 🎨 Modifications visuelles Landing Page
- [x] Agrandir le logo dans le header (h-16)
- [x] Ajouter l'offre Premium à 39€ dans la section tarifs
- [x] Section témoignages complète (pas de section vide)
- [x] Agrandir le logo dans le footer (h-12)
- [x] Supprimer le texte "PRONTO" à côté du logo footer

## 🎨 Header Super Admin
- [x] Remplacer le titre "PRONTO" par le logo horizontal dans ResponsiveHeader

## 🎨 Améliorations visuelles Landing Page v2
- [x] Agrandir encore plus le logo dans le header (h-20)
- [x] Ajouter effet bords dorés en biseau (glassmorphism) sur la carte Premium

## 🎨 Améliorations visuelles Landing Page v3
- [x] Agrandir le logo header à h-28
- [x] Masquer le badge "Recommandé" sur la carte Premium
- [x] Ajouter animation de lumière sur les bords de la carte Premium (shimmer)
- [x] Modifier texte publicité avec italique "garantie non concurrentielle"

## 🤖 Chatbot RISE AI™ sur Landing Page
- [x] Créer composant ChatbotWidget avec design PRONTO
- [x] Créer procédure tRPC pour chat avec contexte PRONTO
- [x] Intégrer le chatbot dans LandingPage.tsx
- [x] Tester les réponses du chatbot (3 tests passés)

## 🤖 Améliorations Chatbot RISE AI™
- [x] Enrichir le contexte pour rendre le chatbot plus intelligent et contextuel
- [x] Corriger la couleur du texte dans le champ de saisie (noir au lieu de blanc)
- [x] Remplacer le bandeau orange par un rouge terra cotta uni (#C75B4B)

## 🎨 Design Chatbot Landing Page
- [x] Remplacer "RISE AI™" par "Assistance PRONTO" dans le header
- [x] Ajouter point vert + "En ligne" sous le titre
- [x] Ajouter footer avec "Propulsé par RISE IA" (lien agencerise.fr)
- [x] Ajouter mentions "Anonyme • Sans rétention de données • Protégé"

## 💬 Questions suggérées chatbot
- [x] Ajouter 3 boutons de questions suggérées au démarrage
- [x] Gérer le clic sur les questions suggérées
- [x] Masquer les suggestions après la première question

## 🎨 Améliorations design chatbot v2
- [x] Ajouter animation pulse au point vert "En ligne"
- [x] Ajouter contour autour des messages utilisateur
- [x] Enrichir contexte pour répondre aux questions sur TasteIt et Restovia

## 📞 Système de demandes d'appel et signalements
- [x] Créer table chatbot_requests dans le schéma Drizzle
- [x] Générer et appliquer la migration SQL
- [x] Créer procédures tRPC pour soumettre et lister les demandes
- [x] Ajouter boutons "Demander un appel" et "Signaler" dans le chatbot
- [x] Créer onglet "Demandes" dans le Super Admin
- [x] Intégrer notifications Manus avec notifyOwner()
- [x] Tester le flux complet

## 🐛 Correction texte chatbot
- [x] Corriger la couleur du texte des messages utilisateur (noir au lieu de blanc)

## 🔧 Séparation données de test Super Admin
- [x] Créer section "Configuration & Tests" sous le tableau restaurants
- [x] Afficher tokens, URLs OAuth, et autres données techniques

## 🔍 Barre de recherche restaurants Super Admin
- [x] Ajouter input de recherche avec icône loupe
- [x] Implémenter filtre en temps réel (nom, slug, email, phone)

## 🎨 Agrandissement logo Super Admin
- [x] Agrandir le logo dans ResponsiveHeader (h-12 sm:h-16)

## 🎨 Doublement taille logo Super Admin
- [x] Doubler la taille du logo (h-24 sm:h-32)

## 📱 Menu burger mobile (16 février 2026)
- [x] Ajouter menu burger mobile sur la landing page PRONTO
- [x] Ajouter menu burger mobile sur le Super Admin

## 📢 Système de publicités configurable
- [x] Créer table `advertisements` pour stocker les publicités
- [x] Créer onglet "Publicités" dans Super Admin avec configuration des formats
- [x] Implémenter format publicité : Pastille
- [x] Implémenter format publicité : Footer
- [x] Implémenter format publicité : Pleine page arrière-plan
- [x] Implémenter format publicité : Pop-up
- [x] Implémenter format publicité : Item plat (vert pesto + mention "Partenariat" dorée + couronne)
- [ ] Afficher les publicités actives sur la landing page selon leur format

## 🐛 Bug OAuth sur Safari mobile (16 février 2026)
- [ ] Investiguer les logs du callback OAuth
- [ ] Identifier la cause de "OAuth callback failed" sur Safari iOS
- [ ] Corriger le problème de callback OAuth mobile
- [ ] Tester la connexion sur Safari iOS

## 📐 Indications de tailles pour les publicités (16 février 2026)
- [x] Ajouter les tailles recommandées pour chaque format dans l'UI Super Admin

## ✅ Validation d'images et planification des publicités (16 février 2026)
- [x] Ajouter champs startDate et endDate à la table advertisements
- [x] Implémenter validation automatique des dimensions d'images dans ImageUploader
- [x] Ajouter interface de planification (dates) dans formulaire publicités
- [x] Implémenter logique backend pour activer/désactiver automatiquement selon dates

## 📧 Formulaire de contact "Essai gratuit" (16 février 2026)
- [x] Créer composant formulaire de contact avec champs (nom, email, téléphone, message)
- [x] Implémenter l'envoi d'email avec notifyOwner incluant la source du clic
- [x] Connecter bouton "Essai gratuit" header au formulaire (source: HEADER)
- [x] Connecter bouton "Essai gratuit" hero au formulaire (source: HERO)
- [x] Connecter bouton "Essai gratuit" footer au formulaire (source: FOOTER)
- [x] Ajouter texte "0€ de frais d'installation" sous la section tarifs
- [x] Corrigé la section vide de la page publique en conditionnant et centrant les blocs contact et horaires
- [x] Sécurisé les lectures analytiques par propriétaire ou Super Admin avant de restaurer les indicateurs du dashboard
- [x] Généralisé le contexte métier et les promesses du chatbot à toutes les activités PRONTO
- [x] Aligné l’accès de gestion des Super Admins email avec les Super Admins OAuth sans élargir les droits propriétaires
- [x] Aligné la liste des entreprises du propriétaire sur l’identité OAuth ou email active
- [x] Vérifié et renforcé l’appartenance propriétaire sur les mutations restaurant restantes
- [x] Généralisé les indicateurs analytiques encore formulés en plats ou menu
- [x] Généralisé les libellés menu et plat visibles dans la gestion détaillée Super Admin
- [x] Généralisé les libellés menu et plat visibles dans le dashboard propriétaire
- [x] Vérifié le secteur déjà choisi dans l’onboarding : il est prioritaire sur le repli du profil entreprise après hydratation
- [x] Généralisé les boutons Nouvelle Catégorie et Ajouter un plat du dashboard propriétaire
- [x] Généralisé les dernières actions et confirmations de catégorie de la gestion détaillée Super Admin
- [x] Généralisé l’invitation de la vue d’ensemble à organiser des catégories
- [x] Ajouté une gestion isolée des rôles et membres d’entreprise pour les propriétaires autorisés
- [ ] Ajouter des tests dédiés d’acceptation unique et d’isolation pour l’invitation sécurisée de membres

## 🔒 Google reCAPTCHA Enterprise invisible (16 février 2026)
- [x] Ajouter le script reCAPTCHA dans client/index.html
- [x] Intégrer la validation reCAPTCHA dans ContactFormDialog
- [x] Ajouter la secret key reCAPTCHA aux variables d'environnement
- [x] Créer la fonction de vérification reCAPTCHA côté serveur
- [x] Intégrer la vérification dans submitContactForm

## 🐛 Erreur ChatbotWidget (16 février 2026)
- [ ] Corriger l'erreur "ERREUR Clé de site : Domaine clé de site..." affichée par le ChatbotWidget

## 🤖 Refonte icône chatbot (16 février 2026)
- [x] Générer icône SVG animée robot souriant style Fallout Yes Man modernisé
- [x] Intégrer l'icône dans ChatbotWidget avec animation
- [x] Repositionner le bouton pour éviter chevauchement avec reCAPTCHA

## 🎨 Mise à jour images chatbot PNG transparentes (16 février 2026)
- [x] Extraire les nouvelles images PNG transparentes optimisées
- [x] Uploader les 4 frames sur S3 CDN (373-381 Ko chacune, 5x plus légères)
- [x] Remplacer les URLs dans ChatbotWidget.tsx

## 📱 Correction responsive chatbot mobile (16 février 2026)
- [x] Analyser le problème : fenêtre trop large, mal positionnée sur mobile
- [x] Rendre la fenêtre pleine largeur sur mobile (left-4 right-4)
- [x] Conserver la largeur fixe 384px sur desktop (sm:w-96)
- [x] Ajouter max-h-[85vh] pour éviter débordement vertical
- [x] Ajuster les marges (bottom-4 sur mobile, bottom-6 sur desktop)

## 🗣️ Amélioration ton chatbot IA (16 février 2026)
- [x] Modifier message d'accueil : "assistant IA de Pronto" au lieu de "RISE AI™"
- [x] Réécrire prompt système pour ton plus naturel et professionnel-jeune
- [x] Supprimer les répétitions "RISE AI" dans les réponses
- [x] Rendre le chatbot moins robotique, plus concis (2-3 phrases max)
- [x] Ton professionnel mais accessible, comme un conseiller startup

## 🔗 Modification footer landing page (16 février 2026)
- [x] Changer le texte : "🎲 Une solution crée par ALTMachine"
- [x] Ajouter lien vers altmachine.fr
- [x] Supprimer la mention Agence Rise

## 🎨 Modifications visuelles landing page (16 février 2026)
- [x] Changer la couleur du bouton "Contacter l'équipe" en jaune doré (#d7c75b)
- [x] Remplacer l'image du footer par le nouveau logo Pronto avec slogan circulaire
- [x] Uploader le logo sur S3 CDN
- [x] Mettre à jour l'URL de l'image dans LandingPage.tsx

## ✨ Effets glassy/liquid glass sur boutons et cartes (16 février 2026)
- [x] Créer les animations CSS glassy/liquid glass dans index.css
- [x] Ajouter classe btn-hero-special au bouton hero "Commencer gratuitement"
- [x] Ajouter classe btn-glassy aux boutons "Voir une démo", "Essayer gratuitement" (footer), "Contacter l'équipe"
- [x] Ajouter classe btn-glassy aux 6 cartes de fonctionnalités
- [x] Animations : liquidGlass (morphing), glassShine (reflet), heroButtonPulse (pulsation)

## 🔧 Corrections animations glassy (16 février 2026)
- [x] Supprimer l'animation liquidGlass qui causait l'effet pilule bizarre
- [x] Simplifier btn-hero-special : retirer pulsation et ripple, garder juste reflet subtil
- [x] Garder uniquement glassShine (reflet lumineux) + translateY + scale au hover
- [x] Bouton hero maintenant sobre avec juste un léger lift au hover

## 🔐 Système d'invitation admin par email avec token (16 février 2026)
- [x] Créer table admin_invitations (id, email, token, expires_at, used_at, created_by)
- [x] Générer migration SQL et l'appliquer
- [x] Créer procédures tRPC : createAdminInvitation, acceptAdminInvitation, listAdminInvitations
- [x] Créer page /admin avec liste des admins et bouton d'invitation
- [x] Créer page /admin/invite/[token] pour accepter l'invitation
- [x] Intégrer envoi d'email avec lien d'invitation
- [x] Tester le flux complet d'invitation

## 🔧 Correction bouton d'invitation admin (16 février 2026)
- [x] Analyser le bouton d'invitation dans Admins.tsx
- [x] Implémenter la logique d'envoi d'invitation fonctionnelle
- [x] Tester l'envoi d'invitation et la copie du lien

## 🔗 Système d'invitation admin autonome (16 février 2026)
- [ ] Modifier schéma admin_invitations pour authentification autonome
- [ ] Ajouter tab 'Générer Invitation' dans Admins
- [ ] Créer page d'acceptation avec auth Google/Email
- [ ] Implémenter création automatique compte admin
- [ ] Tester flux complet invitation autonome

## 🔐 Système d'invitation admin autonome (Google OAuth)
- [x] Créer table admin_accounts pour admins invités
- [x] Modifier table admin_invitations (retirer email, ajouter usedBy)
- [x] Créer procédure generateAdminInvitation (sans email)
- [x] Créer interface de génération de liens dans /admin
- [x] Créer configuration OAuth admin (admin-auth-config.ts)
- [x] Créer routes OAuth admin (/api/auth/admin-google)
- [x] Créer page d'acceptation /invite-admin/:token
- [x] Modifier contexte tRPC pour supporter adminAccount
- [x] Modifier adminProcedure pour accepter les 2 types d'admins

## 🔧 Correction callback OAuth admin
- [x] Corriger la configuration callbackBaseURL pour la production
- [x] Tester le flux complet d'invitation admin

## 🔧 Correction domaine callback OAuth admin
- [x] Utiliser https://pronto.page pour le callback en production

## 🐛 Correction erreur callback OAuth admin
- [ ] Analyser et corriger l'erreur serveur lors du callback

## Système d'invitation admin avec authentification simple
- [x] Modifier le schéma admin_accounts pour ajouter le champ passwordHash
- [x] Supprimer les champs googleId et invitationId de admin_accounts
- [x] Générer et appliquer la migration SQL
- [x] Installer bcrypt pour le hashing des mots de passe
- [x] Supprimer tout le code Google OAuth admin (admin-auth-config.ts, admin-auth-routes.ts)
- [x] Créer les routes d'authentification admin simples via tRPC (register, login, logout, me)
- [x] Créer les procédures tRPC pour l'authentification admin
- [x] Créer la page de création de compte admin sur /invite-admin/:token
- [x] Créer la page de login admin sur /admin/login
- [x] Modifier le middleware d'authentification pour supporter les admins avec email/mot de passe
- [x] Tester le flow complet : génération d'invitation → création de compte → login → accès admin

## 🐛 Correction authentification SuperAdmin
- [x] Modifier SuperAdmin.tsx pour utiliser trpc.adminAuth.me au lieu de useAuth (Manus OAuth)
- [x] Rediriger vers /admin/login si l'admin n'est pas connecté
- [x] Tester le flow complet : login → accès /admin → pas de redirection Manus OAuth

## 🐛 Bug login admin - champs vidés en boucle
- [x] Analyser le code de AdminLogin.tsx pour identifier le problème
- [x] Ajouter l'invalidation de la query adminAuth.me après le login réussi
- [ ] Tester le login en production

## 🔧 Système de connexion automatique par lien magique
- [ ] Créer une procédure tRPC `adminAuth.createMagicLink` pour générer un token de connexion unique
- [ ] Créer une procédure tRPC `adminAuth.loginWithMagicLink` pour connecter automatiquement avec un token
- [ ] Créer une page `/admin/magic-login/:token` qui connecte automatiquement et redirige vers `/admin`
- [ ] Générer un lien magique et tester la connexion automatique

## OAuth Configuration (En cours)
- [x] Configurer PUBLIC_URL pour les callbacks OAuth
- [x] Modifier auth-config.ts pour utiliser PUBLIC_URL
- [ ] Tester le login Google avec invitation restaurant
- [ ] Tester le login Facebook avec invitation restaurant
- [ ] Corriger les erreurs redirect_uri_mismatch si nécessaire

## Redirection OAuth vers dashboard restaurant
- [x] Modifier le callback OAuth Google pour rediriger vers /{slug}/dashboard au lieu de la landing page
- [x] Modifier le callback OAuth Facebook pour rediriger vers /{slug}/dashboard au lieu de la landing page
- [ ] Tester le flow complet avec Google OAuth

## BUG CRITIQUE : Dashboard restaurateur utilise mauvais système OAuth
- [ ] Le dashboard restaurateur redirige vers Manus OAuth au lieu d'utiliser Google/Facebook OAuth
- [ ] Identifier où se fait la vérification d'authentification dans le dashboard
- [ ] Corriger pour utiliser l'auth restaurateur (restaurant_owners) au lieu de l'auth admin (users)
- [ ] Tester la création de catégorie après correction

## Supprimer Manus OAuth du système restaurateur
- [x] Modifier le contexte tRPC pour ne PAS vérifier Manus OAuth sur les routes restaurateur
- [x] Garder uniquement Google/Facebook OAuth pour les restaurateurs
- [ ] Tester la création de catégorie après modification

## BUG CRITIQUE : Session Passport.js non persistée
- [x] La session Google OAuth n'est pas sauvegardée après login
- [x] Vérifier la configuration express-session (secure, sameSite, domain)
- [x] Ajout de sameSite: 'lax' pour permettre l'envoi du cookie
- [ ] Tester en production après publication

## BUG CRITIQUE : Session Passport.js non persistée après login
- [x] La page /login-restaurant affiche correctement Google/Facebook OAuth
- [x] Après login Google, la session n'est PAS persistée lors des requêtes tRPC
- [x] Vérifier les logs serveur pour voir si serializeUser/deserializeUser sont appelés
- [x] Identifier pourquoi le cookie n'est pas envoyé avec les requêtes tRPC
- [x] Créer session-middleware.ts pour configurer session globalement
- [x] Modifier server/_core/index.ts pour appliquer session AVANT les routes tRPC
- [ ] Tester en production après publication

## BUG CRITIQUE : Session Passport.js non créée après OAuth
- [x] Le callback OAuth ne crée PAS de session persistante avec req.login()
- [x] L'utilisateur est authentifié une fois mais pas "connecté" de manière persistante
- [x] Ajouter des logs détaillés dans auth-routes.ts pour tracer le callback OAuth
- [ ] Tester en production et analyser les logs pour identifier le problème exact
- [ ] Corriger selon les résultats des logs

## ANALYSE : Pourquoi Passport.js ne fonctionne pas ?
- [x] Vérifier si Manus OAuth et Passport.js entrent en conflit (double système d'auth) - Pas de conflit détecté
- [x] Vérifier l'ordre d'initialisation : initializePassport() doit être appelé AVANT passport.initialize() - Ordre correct
- [x] Tester en appelant manuellement req.login() dans le callback OAuth - En cours
- [x] PROBLÈME IDENTIFIÉ : Cookie de session n'a PAS de domain configuré → ne fonctionne pas sur sous-domaines
- [x] PROBLÈME IDENTIFIÉ : MemoryStore utilisé → sessions perdues au redémarrage serveur
- [x] Corriger req.login() pour attendre la création de session AVANT redirection
- [x] Ajouter domain: '.pronto.page' au cookie de session
- [x] Implémenter session store persistant (MySQL)
- [x] PROBLÈME IDENTIFIÉ : Erreur de parsing DATABASE_URL dans MySQL session store (ENOTFOUND)
- [x] Corriger le parsing de DATABASE_URL pour extraire correctement host/user/password/database
- [ ] Tester en production et vérifier que la session persiste
- [x] Retirer MySQL session store (trop complexe, causait des erreurs de connexion)
- [x] Revenir à MemoryStore simple pour le développement
- [x] Supprimer la route POST /api/admin/login en doublon dans auth-routes.ts
- [x] Retirer sameSite et domain du cookie pour revenir à la config stable f8623700
- [ ] Tester le login admin en production


## NETTOYAGE ET TESTS (17 février 2026)
- [x] Retirer MySQL session store (trop complexe, causait des erreurs de connexion)
- [x] Revenir à MemoryStore simple pour le développement
- [x] Supprimer la route POST /api/admin/login en doublon dans auth-routes.ts
- [x] Retirer sameSite et domain du cookie pour revenir à la config stable f8623700
- [x] Nettoyer les fichiers obsolètes (RestaurantHomePage.OLD.tsx, check-admins.ts, test-admin-login.sh)
- [x] Tester le login admin en local - FONCTIONNE PARFAITEMENT
- [x] Analyse complète du système en production et local
- [ ] Publier et tester en production


## PHASE 4 - IMPLÉMENTATION SÉCURISÉE (17 février 2026)

### Session Management (MySQL Store)
- [x] Installer express-mysql-session et mysql2
- [x] Parser DATABASE_URL pour extraire host/user/password/database
- [x] Créer pool MySQL avec SSL (TiDB Cloud requis)
- [x] Configurer MySQL session store avec pool SSL
- [x] Corriger cookie.secure pour dev/production (ENV.isProduction)
- [x] Tester login admin en local (✅ SUCCÈS)
- [x] Tester persistance de session (✅ SUCCÈS)
- [x] Créer tests unitaires session.test.ts (✅ 5/5 tests passent)

### Rate Limiting (Sécurité)
- [x] Installer express-rate-limit
- [x] Créer rate-limiters.ts (admin + OAuth)
- [x] Appliquer adminLoginLimiter sur /api/admin/login (5 tentatives / 15 min)
- [x] Appliquer oauthLimiter sur Google/Facebook OAuth (20 tentatives / 15 min)
- [x] Tester rate limiting (✅ bloque après 5 tentatives)

### Nettoyage et Corrections
- [x] Corriger AdminInviteAccept.tsx (verifyAdminInvitation → checkAdminInvitation)
- [x] Supprimer fichiers obsolètes (RestaurantHomePage.OLD.tsx, BACKUP.tsx)
- [x] Supprimer fichiers de test temporaires (check-admin-password.ts, create-test-admin.ts, etc.)
- [x] Exporter app depuis server/_core/index.ts pour tests
- [x] Supprimer logs de debug console.log inutiles

### Documentation Forensic
- [x] Créer FORENSIC_ANALYSIS.md (analyse ligne par ligne)
- [x] Créer PHASE2_CONSOLIDATION.md (preuves techniques)
- [x] Créer PHASE3_STRATEGIE_CHIRURGICALE.md (plan de correction)
- [x] Créer RAPPORT_TEST_PRODUCTION.md (tests production)
- [x] Créer NETTOYAGE_CODE.md (rapport nettoyage)
- [x] Créer SYNTHESE_ANALYSE.md (synthèse finale)

### Tests et Validation
- [x] Créer compte admin de test (test@pronto.admin / TestAdmin123!)
- [x] Tester login avec curl (✅ 302 redirect + cookie)
- [x] Tester session persistence avec curl (✅ tRPC retourne admin)
- [x] Exécuter tests unitaires session.test.ts (✅ 5/5 passent)
- [ ] Tester en production après publication
- [ ] Valider login admin sur pronto.page
- [ ] Valider login restaurateur OAuth sur pronto.page

## BUGS À CORRIGER (17 février 2026)
- [x] Bug CRITIQUE: Les restaurateurs sont redirigés vers Manus OAuth lors de la création de catégorie (protectedProcedure ne reconnaît pas ctx.restaurantOwner)
- [x] restaurantOwnerProcedure middleware existe déjà (ligne 100 de trpc.ts)
- [x] Remplacé 15 occurrences de protectedProcedure par restaurantOwnerProcedure dans restaurant.ts
- [ ] Tester la création de catégorie en tant que restaurateur en production

## BUGS FORMULAIRE CRÉATION PLAT (17 février 2026)
- [x] Dialog de création de plat trop grand sur mobile - Ajouté max-h-[90vh] overflow-y-auto
- [x] Upload d'image échouait avec erreur "Cannot read properties of null (reading 'id')" - Corrigé pour utiliser ctx.restaurantOwner?.id au lieu de ctx.user!.id
- [ ] Tester en production

## BUGS PARAMÈTRES RESTAURANT (17 février 2026)
- [x] La sauvegarde des paramètres restaurant ne fonctionnait pas - Corrigé pour utiliser ctx.restaurantOwner au lieu de ctx.user
- [x] Ajouté upload de logo avec dimensions recommandées (200x200px carré)
- [x] Ajouté upload de photo de couverture avec dimensions recommandées (1920x600px bannière)
- [x] Ajouté indications visuelles des dimensions recommandées dans le formulaire
- [ ] Vérifier que le logo apparaît dans le placeholder de la page publique
- [ ] Tester la sauvegarde complète en production (paramètres + logo + couverture)

## DESIGN PAGE PUBLIQUE MENU (17 février 2026)
- [x] Ajouté image de fond sur la section hero du menu public (même style que mini-site)
- [x] Appliqué effet de flou blur(8px) sur l'image de fond
- [x] Ajouté overlay sombre (bg-black/50) pour la lisibilité du texte
- [x] Utilisé heroImageUrl du restaurant pour l'image de fond
- [x] Texte en blanc avec drop-shadow pour meilleure lisibilité
- [ ] Tester en production sur mobile et desktop

## BUGS SUPER ADMIN - GESTION PUBS (17 février 2026)
- [x] Dialog de création/modification des pubs trop grand - boutons Sauvegarder/Annuler cachés (mobile ET desktop)
- [x] Ajouté max-h-[90vh] overflow-y-auto aux deux dialogs (création et modification)
- [ ] Tester en production sur mobile et desktop

## BUGS AFFICHAGE PUBLICITÉS (17 février 2026)
- [x] Publicité format "Pleine page (arrière-plan)" s'affichait EN AVANT-PLAN au lieu d'être en arrière-plan
- [x] Corrigé le z-index de z-0 à -z-10 pour que l'image soit derrière le contenu
- [ ] Tester en production

## BUG TAILLE PUBLICITÉ DISH_ITEM (17 février 2026)
- [x] La publicité format "dish_item" était beaucoup trop grande par rapport aux plats normaux
- [x] Identifié les dimensions exactes des plats normaux dans RestaurantMenuPage.tsx (Card avec p-6, image w-24 h-24)
- [x] Ajusté le composant DishItemAd pour qu'il ait exactement la même structure (Card + CardContent p-6, image w-24 h-24)
- [x] Supprimé l'aspect-[4/3] qui rendait l'image trop grande
- [x] Conservé le style visuel distinctif (gradient vert, badge PARTENARIAT doré)
- [ ] Tester en production

## BUG PUBLICITÉ FULLPAGE INVISIBLE (17 février 2026)
- [x] La publicité fullpage n'était plus visible après le changement de z-index à -z-10
- [x] Analysé : l'image était cachée DERRIÈRE le fond bg-background du conteneur principal
- [x] Corrigé : changé z-index de -z-10 à z-0 dans AdvertisementDisplay.tsx
- [x] Ajouté relative au conteneur principal dans RestaurantMenuPage.tsx pour créer un contexte de stacking
- [x] PROBLÈME : L'image était visible MAIS AU-DESSUS du contenu (menu, header, cards)
- [x] SOLUTION : Ajouté relative z-10 bg-background à toutes les sections (hero, filtres, menu, footer)
- [x] Image fullpage reste à z-0, contenu à z-10, header à z-40
- [ ] Tester en production

## BUG PUBLICITÉ FULLPAGE CACHÉE PAR FOND BLANC (17 février 2026)
- [x] Les sections menu et filtres avaient bg-background qui cachait complètement l'image fullpage
- [x] Retiré bg-background des sections filtres et menu (lignes 185 et 220)
- [x] Gardé relative z-10 pour que le contenu reste au-dessus
- [x] L'image fullpage est maintenant visible à travers les espaces entre les cards
- [ ] Tester en production

## AMÉLIORATION STABILITÉ PAGE AVEC PUB FULLPAGE (17 février 2026)
- [x] Ajouté détection de publicité fullpage active (ligne 128)
- [x] Ajouté bg-background conditionnel aux sections menu et filtres (lignes 188, 223)
- [x] Si PAS de pub fullpage active → fond blanc normal (stabilité)
- [x] Si pub fullpage active → fond transparent (image visible)
- [ ] Tester en production avec et sans pub fullpage

## RESTAURANT LA VOILE ROUGE (18 février 2026)
- [x] Créé le compte admin restaurant.lavoilerouge@gmail.com avec MDP hashé bcrypt
- [x] Créé le restaurant "La Voile Rouge" (slug: la-voile-rouge, plan PRO, couleurs bordeaux/doré)
- [x] Créé la catégorie "Entrées" et saisi les 11 plats (15€ à 24€)
- [x] Créé la catégorie "Poissons" et saisi les 9 plats + menu enfant (12€ à 30€)
- [x] Créé la catégorie "Viandes" et saisi les 9 plats (21€ à 80€/kg)
- [x] Créé la catégorie "Pâtes & Risotti" et saisi les 6 plats (21€ à 27€)
- [x] Créé la catégorie "Burgers" et saisi les 3 plats (18.50€ à 21€)
- [x] Créé la catégorie "Desserts" et saisi les 13 desserts (2€ à 12€)
- [x] Config chatbot créée (ton chaleureux, message de bienvenue)
- [x] Vérifier la page publique et le dashboard

## CONNEXION EMAIL/MDP RESTAURATEUR (18 juin 2026)
- [x] Analysé la page de connexion restaurateur et les routes auth existantes
- [x] Ajouté formulaire email + MDP sur la page de connexion restaurateur (RestaurantLogin.tsx)
- [x] Créé la route POST /api/auth/email-login dans auth-routes.ts
- [x] Étendu le schéma restaurant_owners avec provider 'email' et champ passwordHash
- [x] Créé le restaurantOwner La Voile Rouge (ID 30001) avec hash bcrypt
- [x] Lié le restaurantOwner au restaurant la-voile-rouge via restaurants.ownerId
- [ ] Tester la connexion email/MDP sur /la-voile-rouge/dashboard

## REHAUSSEMENT DESIGN PRONTO (18 juin 2026)
- [x] Agrandi le logo de navigation de la landing et ajusté son conteneur pour améliorer sa lisibilité
- [x] Auditer la landing page, les dashboards et les pages de menu afin d'identifier les améliorations visuelles prioritaires
- [x] Défini et intégré des fondations premium partagées : typographie, couleurs, matériaux, transitions, focus et préférence de mouvement réduite
- [x] Créé un indicateur de chargement local, accessible et respectueux de la préférence de mouvement réduite
- [x] Moderniser la landing page avec une narration visuelle claire et des CTA à fort contraste
- [x] Moderniser le dashboard Super Admin sans altérer ses parcours métier ni ses contrôles d'accès
- [x] Moderniser le dashboard restaurateur sans altérer la gestion des menus, médias et paramètres
- [x] Affiner les pages publiques de menu pour préserver la lisibilité tout en renforçant l'identité de chaque restaurant
- [ ] Vérifier les comportements mobile, clavier, réduction des animations, chargement et régressions fonctionnelles
- [ ] Créer un checkpoint final de la refonte visuelle

## REFONTE GLOBALE MULTI-SECTEURS (18 juin 2026)
- [x] Réalisé l'audit global du produit, de l'architecture, de la sécurité, des données, de l'accessibilité et des parcours utilisateurs
- [x] Documenté les risques prioritaires, les incohérences de modèle et les régressions potentielles dans docs/2026-08-18-audit-global-plateforme.md
- [x] Identifié les urgences P0 : invitations publiques, connexion Super Admin par simple email, vulnérabilités de dépendances, build TypeScript et tests instables
- [x] Restreint la création et les listings d'invitations aux seuls Super Admins autorisés
- [x] Maintenu la validation publique d'une invitation avec un retour minimal et sans exposer les détails internes
- [x] Supprimé la connexion Super Admin par simple email et empêché toute ouverture de session sans preuve de contrôle du compte
- [x] Appliqué une limite de débit dédiée à la connexion email/mot de passe des propriétaires d'entreprise
- [x] Appliqué la limite générale de débit au gateway tRPC, sans gêner les parcours légitimes
- [x] Réduit les journaux d'authentification et de proxy pour ne plus exposer email, session, identifiants ou réponses internes
- [x] Réduit les limites globales de corps HTTP et préparé une stratégie d'upload dédiée
- [x] Corrigé l'incompatibilité de types entre le pool mysql2 et express-mysql-session afin de rétablir la vérification TypeScript
- [x] Mis à jour les tests d'invitation avec un contexte administrateur explicite, des données isolées et une vérification du refus anonyme
- [x] Mis à niveau les dépendances de production vulnérables et validé build et tests ; audit réduit à 0 critique et 3 hautes transitives
- [ ] Préparer séparément la migration Express 5 et la mise à niveau des composants de rendu pour traiter les alertes transitives restantes sans casser les routes publiques
- [x] Conçu le modèle multi-secteurs : entreprise, profil public, catalogue, collection, item, service et rendez-vous
- [x] Préparé la migration additive sans rupture des restaurants, menus, comptes et URLs existants dans docs/2026-08-18-architecture-multi-secteurs.md
- [x] Ajouté les tables génériques businesses, business_profiles, business_members, catalogs, catalog_collections et catalog_items au schéma Drizzle
- [x] Ajouté les contraintes d'unicité, index et champs de compatibilité legacy sans supprimer les tables restaurants/menu existantes
- [x] Généré, lu et appliqué la migration SQL additive dans TiDB Cloud, avec vérification des six tables créées
- [x] Migré les restaurants, propriétaires, catégories et plats existants vers leur équivalent générique par script idempotent (6 entreprises, 23 collections, 139 éléments)
- [x] Ajouté le routeur businesses avec lecture publique minimale, accès workspace et vérification de rôle par entreprise
- [x] Ajouté les tests de permissions du noyau entreprise (4 tests passants)
- [x] Corrigé le helper IA serveur pour utiliser un modèle réellement disponible et accepter une sélection de modèle explicite
- [x] Unifié les rôles, sessions, autorisations, invitations, récupération de compte et journalisation de sécurité autour d'un principal typé et de sessions renforcées
- [x] Cartographié les comptes administrateur et propriétaire, leurs sessions et les routes qui les consomment
- [x] Ajouté un journal minimal d'événements de sécurité sans stocker de mot de passe, session ou jeton brut
- [x] Ajouté un flux de demande et de confirmation de réinitialisation de mot de passe à usage unique et expirant
- [x] Ajouté une table de jetons de réinitialisation hachés, expirants et à usage unique
- [x] Généré un lien de réinitialisation uniquement pour les propriétaires utilisant l'email/mot de passe, sans révéler l'existence du compte au navigateur
- [x] Ajouté une confirmation de réinitialisation avec politique de mot de passe et invalidation atomique du jeton
- [x] Mis en place une demande de récupération neutre, limitée et notifiée à l'équipe, sans révéler l'existence d'un compte
- [x] Centralisé les opérations de connexion, déconnexion et récupération sans casser Google/Facebook ni le compte email de La Voile Rouge
- [x] Régénéré l'identifiant de session lors des connexions par mot de passe et détruit entièrement la session lors de la déconnexion
- [x] Ajouté un changement de mot de passe authentifié pour les comptes administrateur et propriétaire email, avec politique de mot de passe renforcée
- [x] Ajouté des tests de jeton expiré, jeton utilisé, rejet d'accès et journalisation sans données sensibles
- [x] Créé un parcours d'onboarding guidé par type d'entreprise et objectif de publication
- [x] Créé une table de progression d'onboarding par entreprise, avec type d'activité, objectif et étapes complétées
- [x] Ajouté une première expérience guidée dans le dashboard pour choisir l'activité, préparer le catalogue puis publier
- [x] Créé des imports CSV, photo et PDF avec aperçu, validation, revue et publication explicitement contrôlée
- [x] Ajouté les tables import_jobs et import_job_rows avec statut, fichier source, brouillon normalisé et erreurs de validation
- [x] Créé un endpoint sécurisé d'analyse d'import qui valide fichier, type MIME, taille et accès à l'entreprise avant extraction
- [x] Limité la taille de la chaîne base64 avant décodage afin d'éviter une surcharge mémoire lors d'un import
- [x] Ajouté l'extraction CSV locale et l'extraction structurée IA pour image ou PDF, avec confiance par élément
- [x] Créé une mutation d'application explicite du brouillon importé dans un catalogue, sans publication automatique
- [x] Ajouté les tests de parsing, d'autorisation et de validation de fichier du flux d'import
- [ ] Tester manuellement un import authentifié CSV, image et PDF avant mise en production du parcours d'import
- [ ] Exécuter un import CSV contrôlé sur un espace de test, vérifier le brouillon créé puis nettoyer toutes les données de validation
- [x] Mis en place une médiathèque avec contrôle de type, taille, propriété et archivage réversible par entreprise
- [x] Créé une table media_assets et un routeur d'upload rattaché à une entreprise avec validation de MIME, taille et propriété
- [x] Ajouté une bibliothèque de médias dans le dashboard, avec aperçu, copie d'URL et archivage confirmé (la suppression physique du stockage sera ajoutée avec l'API de suppression)
- [x] Ajouté des tests de validation de signature et de taille des médias avant l'écriture dans le stockage
- [x] Ajouté des tests d'accès, de persistance et d'isolation pour l'onboarding et la médiathèque d'entreprise
- [x] Ajouté un test d'archivage de média qui vérifie son retrait de la bibliothèque sans suppression physique
- [ ] Refondre la navigation, les fils d'Ariane, les états vides, erreurs, chargements et confirmations d'action
- [x] Localisé la page introuvable en français cohérent avec PRONTO
- [x] Généralisé le formulaire de contact pour parler d'entreprise et d'activité plutôt que de restaurant
- [x] Aligné l'accroche du formulaire de contact avec le positionnement multi-secteurs de PRONTO
- [x] Généralisé l'aide de configuration chatbot du dashboard pour toutes les activités
- [x] Généralisé les libellés de connexion pour accueillir toute entreprise tout en gardant les routes existantes
- [x] Généralisé les derniers libellés visibles « restaurant » dans les invitations, réservations, événements, dashboard et supervision
- [x] Aligné l’interface d’import sur le cycle réel d’analyse, revue, création de brouillon et publication séparée
- [x] Ajouté un test d’intégration CSV validant l’application explicite en brouillon, sans publication automatique
- [x] Vérifié par test que l’application d’import refuse tout brouillon non revu
- [x] Vérifié par test que l’analyse rejette un fichier dont le MIME déclaré ne correspond pas au contenu binaire
- [x] Renommé les propriétés d’interface restaurantName en businessName sans modifier les identifiants API legacy
- [x] Généralisé l’intitulé de destination dans la liste d’invitations Super Admin
- [x] Retiré la propriété businessName inutilisée du parcours d’inscription événementielle
- [x] Généralisé les libellés visibles « Menu » du dashboard en « Catalogue » sans modifier l’onglet legacy
- [x] Remplacé l’affichage de formule « Menu » par une appellation multi-secteurs sans modifier la souscription stockée
- [x] Couvert par tests l’archivage et la restauration réversible d’un média d’entreprise autorisé
- [x] Exposé la restauration contrôlée d’un média archivé dans la médiathèque entreprise
- [x] Harmonisé les libellés de formule dans la supervision Super Admin sans modifier les souscriptions stockées
- [x] Harmonisé le badge de formule de la page détaillée Super Admin sans modifier la souscription stockée
- [x] Généralisé les libellés des invitations Super Admin encore orientés restaurants
- [x] Harmonisé les options de formule Super Admin en Essentiel, Pro et Premium sans modifier les valeurs legacy
- [x] Prérempli l’activité de l’onboarding depuis le profil de l’entreprise pour éviter le biais restaurant
- [x] Vérifié par test que l’espace entreprise expose son activité pour l’onboarding multi-secteurs
- [x] Retiré les identifiants codés en dur du script de démonstration versionné et assaini l’historique Git public
- [x] Documenté l’exécution des scripts de démonstration sans secrets versionnés
- [x] Généralisé les libellés de personnalisation, réservation et événement encore centrés restaurant dans le dashboard
- [x] Rédigé un README professionnel couvrant l’architecture, la sécurité, les parcours et l’exploitation de PRONTO
- [x] Synchronisé l’état validé du projet vers le dépôt GitHub z6787nh8b9-cpu/pronto-resto-live
- [x] Supprimé l'identifiant propriétaire codé en dur lors de la création d'une entreprise par le Super Admin
- [x] Remplacé les procédures publiques de gestion des réservations par des contrôles propriétaire ou Super Admin et vérifié l'accès au restaurant ciblé
- [x] Ajouté un test garantissant qu'un visiteur anonyme ne peut plus gérer paramètres, zones ni réservations
- [x] Retiré les créneaux fictifs et empêché la création de réservation hors capacité, hors délai ou sur un créneau occupé
- [x] Remplacé les créneaux fictifs par un calcul dynamique fondé sur les horaires, délais, zones actives et capacité cumulée
- [x] Réutilisé les contrôles de délai, capacité et créneau lors de la création publique de réservation
- [x] Remplacé le jeton de confirmation de réservation généré par Math.random par une valeur cryptographiquement sûre
- [x] Restreint la génération de traductions IA aux propriétaires autorisés et Super Admins afin d'éviter les déclenchements coûteux publics
- [x] Ajouté un test garantissant qu'un visiteur anonyme ne peut pas déclencher une traduction IA
- [x] Remplacé le jeton d'inscription événementielle généré par Math.random par une valeur cryptographiquement sûre
- [x] Migré les procédures événement vers les rôles propriétaire et Super Admin avec vérification du restaurant ciblé
- [x] Migré les procédures d'horaires vers les rôles propriétaire et Super Admin avec vérification du restaurant ciblé
- [x] Migré l'upload historique vers les rôles propriétaire et Super Admin avec chemin de stockage rattaché à l'identité active
- [x] Migré les traductions de gestion et de génération IA vers les rôles propriétaire et Super Admin avec vérification du restaurant ciblé
- [x] Éliminé les anciens middlewares Manus des routeurs métier au profit des rôles propriétaire et Super Admin
- [x] Ajouté des bornes de saisie strictes au chatbot public afin de contenir les coûts IA et les abus ; le garde-fou tRPC global reste appliqué
- [x] Empêché l'affichage de l'avertissement reCAPTCHA de clé production dans le développement local, sans accepter de jeton arbitraire
- [x] Migré les procédures de galerie vers les rôles propriétaire et Super Admin avec vérification du restaurant ciblé
- [x] Ajouté un fil d'Ariane lisible à l'espace entreprise et remplacé le retour ambigu vers Super Admin par un retour Accueil
- [x] Remplacé la confirmation navigateur de retrait de média par une confirmation accessible cohérente avec l'interface
- [x] Repenser le dashboard entreprise autour de la publication, du catalogue, des contacts, des rendez-vous et des performances
- [x] Ajouté une vue d'ensemble orientée actions et statuts, sans supprimer les onglets métier existants
- [x] Généralisé le vocabulaire du dashboard pour présenter un espace entreprise, tout en gardant la compatibilité restaurant
- [x] Mis en valeur les parcours catalogue, import, vitrine et informations de contact avec une navigation plus lisible
- [x] Vérifié l'accès propriétaire de La Voile Rouge et la conservation du scroll horizontal des onglets pour les petits écrans
- [x] Refait l'espace Super Admin pour la supervision, le support, les accès et la gestion multi-entreprises
- [x] Ajouté une vue opérationnelle multi-entreprises avec métriques, accès rapides et actions de supervision
- [x] Clarifié le vocabulaire restaurants vers entreprises sans modifier les procédures legacy existantes
- [x] Regroupé les actions sensibles et rendu leurs confirmations, erreurs et retours d'état explicites via les composants existants
- [x] Vérifié que les données et boutons Super Admin restent accessibles au clavier et que les onglets défilent horizontalement sur petits écrans
- [x] Déplacé la redirection Super Admin hors de la phase de rendu React pour éviter les effets de bord et les boucles de navigation
- [x] Refondue la landing page afin d'adresser les commerces, prestataires et établissements au-delà de la restauration
- [x] Repositionné le message autour des catalogues, services et réservations, sans promesses sectorielles exclusives
- [x] Ajouté un parcours d'entrée clair par activité avec accès à la connexion, au contact et à une vitrine de démonstration
- [x] Recomposé les sections marketing selon une narration attention, intérêt, désir et action, en préservant le formulaire de contact et l'assistance existants
- [x] Contrôlé le rendu desktop, les contrastes, les focus et la préférence de mouvement réduit de la nouvelle landing
- [x] Rendu les vitrines publiques adaptables au catalogue, aux prestations, à la réservation et à l'identité de marque de chaque secteur
- [x] Ajouté une présentation de vitrine qui identifie sans ambiguïté l'entreprise et son contenu public
- [x] Rendu le vocabulaire de recherche et des collections neutre entre menu, produits et prestations
- [x] Préservé les itinéraires, images hero, publicités et filtres existants des restaurants pendant l'adaptation
- [x] Vérifié visuellement la vitrine La Voile Rouge et l'accessibilité de sa navigation publique
- [x] Supprimé la collection legacy vide dupliquée « Vins au verre » sans toucher aux trois éléments publiés
- [x] Écrit et exécuté les tests unitaires, d'intégration et de régression couvrant les parcours critiques (26 tests passants)
- [x] Mis en place les contrôles d'accessibilité, de performance, d'observabilité et de reprise après incident
- [x] Ajouté des en-têtes HTTP de sécurité cohérents et retiré la signature technique Express
- [x] Ajouté une sonde de santé exploitable par l'hébergement sans révéler d'informations sensibles
- [x] Renforcé la limite d'erreur front-end afin d'isoler un écran en défaut et guider l'utilisateur vers une reprise sûre
- [x] Vérifié les parcours publics, propriétaire et Super Admin après les changements transverses
- [x] Documenté les procédures de reprise, les alertes utiles et les risques résiduels connus

## 🔐 PRIORITÉ ABSOLUE — DURCISSEMENT AUTHENTIFICATION, SESSION ET DROITS (19 août 2026)
- [x] Écrire les tests d’invitation membre : acceptation unique, expiration, correspondance stricte de l’adresse email et isolation inter-entreprises
- [ ] Auditer la durée de vie effective du cookie, des sessions MySQL et des sessions Passport en développement et en production
- [x] Appliquer et tester une expiration glissante bornée pour éviter la déconnexion d’un utilisateur actif tout en conservant une durée de session limitée
- [x] Vérifier la régénération de session après toute connexion et changement de privilège, ainsi que l’invalidation globale lors d’un changement de mot de passe
- [x] Mettre en place une version d’authentification contrôlée pour invalider toutes les sessions antérieures après un changement ou une réinitialisation de mot de passe
- [x] Couvrir par test la rotation de version d’authentification et le rejet d’une session Super Admin antérieure
- [x] Unifier la destruction serveur et l’effacement du cookie de chaque chemin de déconnexion propriétaire, Super Admin et Manus
- [x] Vérifier et compléter les protections CSRF des mutations critiques, sans dégrader OAuth ni les formulaires publics légitimes
- [x] Ajouter un contrôle d’origine explicite aux mutations tRPC et aux changements de mot de passe authentifiés
- [ ] Auditer les en-têtes de sécurité réellement servis en production : CSP, HSTS, anti-clickjacking, cookies et cache
- [x] Ajouter et tester une politique CSP de production restrictive, compatible avec reCAPTCHA, polices et médias de vitrines
- [x] Ajouter des limites de débit et une journalisation minimisée pour la création et l’acceptation d’invitations membres
- [x] Journaliser la création et l’acceptation d’invitations membres sans persister le jeton ou l’adresse invitée
- [x] Installer une limite de débit dédiée aux mutations d’invitation membre, plus stricte que le garde-fou tRPC général
- [ ] Exécuter un protocole de validation manuelle en production : connexion, déconnexion, reconnexion, récupération et changement de mot de passe propriétaire
- [ ] Exécuter un protocole de validation manuelle en production : connexion Super Admin, isolation des entreprises et refus des accès transverses

## 🎨 REFONTE DES VITRINES D’ÉTABLISSEMENTS — DESIGN APPLE ET HAUT DE GAMME (19 août 2026)
- [ ] Auditer RestaurantHomePage et RestaurantMenuPage : hiérarchie, espaces, z-index, contrastes, responsive, états vides et sorties de parcours
- [ ] Définir un socle visuel premium multi-secteurs : typographies sans serif et serif non génériques, rythme vertical, matériaux et tokens cohérents
- [ ] Refondre le hero public : image 1920×600, flou d’arrière-plan 8px, voile sombre lisible, navigation flottante et hiérarchie de marque
- [ ] Remplacer les cartes, contrôles et CTA incohérents par des composants à double contour, focus visible et micro-interactions accessibles
- [ ] Ajouter des entrées de contenu performantes via IntersectionObserver, des transitions interruptibles et le respect de la réduction des animations
- [ ] Vérifier chaque vitrine restaurateur, beauté, retail et service aux formats mobile, tablette et bureau sans modifier les URL ni données historiques

## 🧭 DÉCISIONS D’ARCHITECTURE ET TRAJECTOIRE MOBILE B2B (19 août 2026)
- [ ] Produire une recommandation argumentée sur Supabase, Vercel et ManyChat au regard de l’architecture TiDB, Node et React actuelle
- [ ] Documenter les trajectoires PWA, Capacitor et React Native/Expo pour une application B2B distribuable sur App Store et Google Play
- [ ] Définir le prototype cible, les prérequis de conformité et une feuille de route de conversion mobile sans duplication prématurée du produit
