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
