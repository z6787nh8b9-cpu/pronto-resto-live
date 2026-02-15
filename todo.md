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
