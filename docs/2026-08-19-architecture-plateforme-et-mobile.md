# Décision d’architecture — PRONTO

**Décision au 19 août 2026.** PRONTO conserve à court terme son architecture actuelle : React/Vite côté client, Node/Express/tRPC côté serveur, TiDB et sessions persistantes. Cette décision évite une seconde migration d’identité pendant que les parcours d’authentification viennent d’être sécurisés et validés.

## Évaluation des plateformes

| Option | Apport réel pour PRONTO | Coût ou risque à court terme | Décision |
|---|---|---|---|
| **Supabase** | Offre Postgres, Auth, Storage, Realtime et fonctions dans une même plateforme ; ses contrôles RLS sont adaptés aux lectures directes depuis un client quand ils sont correctement conçus.[1] | Remplacer TiDB, les comptes locaux, OAuth, sessions persistantes, RBAC, médiathèque et migrations introduirait une migration de données et d’identité à risque élevé. | **Pas nécessaire maintenant.** Réévaluer uniquement si le produit exige du temps réel natif, une forte autonomie de données côté client ou une consolidation vers Postgres. |
| **Vercel** | Offre des environnements de prévisualisation associés aux commits et une bonne distribution pour un frontend séparé.[2] | Séparer aujourd’hui le frontend du serveur rompt le modèle same-origin qui vient d’être durci : cookies, CSRF, OAuth, sessions et observabilité deviennent plus complexes. | **Pas nécessaire pour l’application complète.** À considérer plus tard pour une landing page marketing statique ou une séparation frontend/backend explicitement choisie. |
| **ManyChat** | Peut automatiser des réponses aux commentaires et DM Instagram, transformer une demande en conversation et connecter WhatsApp Business selon les règles Meta.[3] [4] | Multiplie les connexions de comptes clients, consentements, règles de messagerie, support et risques de conformité. Il ne remplace ni le catalogue, ni la réservation, ni l’identité PRONTO. | **Optionnel, non central.** Créer d’abord un module d’intégration lorsque quelques clients pilotes ont un usage WhatsApp/Instagram mesurable. |

## Décision ManyChat : deux voies viables

| Approche | Expérience obtenue | Coût et complexité | Quand la choisir |
|---|---|---|---|
| **Liens profonds et réponses manuelles assistées** | Le client partage sa vitrine, son catalogue ou son lien de réservation dans ses canaux existants ; PRONTO reste la source de vérité. | Faible ; aucune donnée de messagerie ni connexion Meta à administrer. | **Maintenant.** C’est le chemin le plus fiable pour apprendre les besoins réels. |
| **Intégration ManyChat par établissement** | Un commentaire ou un DM peut déclencher un parcours vers une vitrine, une réservation ou une collecte de lead consentie. | Élevé ; OAuth Meta, webhooks vérifiés, consentement, journalisation, limites de plateforme et support multi-tenant. | Après validation sur des pilotes qui génèrent un volume mesurable de conversations répétitives. |

> ManyChat est un **canal d’acquisition et de relation**, non une fondation technique. PRONTO doit rester propriétaire du catalogue, des disponibilités, des réservations, des droits et des données d’entreprise.

## Trajectoire mobile B2B recommandée

| Étape | Produit | Avantage | Limite assumée | Seuil de passage |
|---|---|---|---|---|
| **1. PWA installable** | Dashboard propriétaire responsive, installable et capable d’assurer les tâches essentielles hors connexion. | Une base web unique, déploiements immédiats et installation sans imposer un store ; une PWA peut aussi être distribuée via certains stores selon leurs règles.[5] | Intégrations OS et comportement selon navigateurs restent variables, particulièrement sur iOS.[5] | Quand l’usage terrain mobile est régulier et que la demande de notifications ou d’app-store est documentée. |
| **2. Capacitor** | Emballage iOS/Android du frontend web pour publication en store. | Capacitor s’insère dans un projet JavaScript moderne et donne accès aux APIs natives sans abandonner le socle web.[6] | Le produit reste une expérience web encapsulée ; les interactions très natives doivent être testées appareil par appareil. | Quand la présence App Store / Google Play est demandée, sans besoin d’interface métier native distincte. |
| **3. React Native avec Expo** | Application B2B dédiée aux équipes en établissement : alertes, scan, photo, notifications, accès hors ligne plus poussé et rôles opérationnels. | Réutilise TypeScript et la logique métier tout en livrant une interface native ; Expo prend en charge les builds, signatures et soumissions de stores.[7] | Requiert une couche de design et de navigation mobile dédiée ; il ne faut pas copier le dashboard web écran par écran. | Quand les usages opérationnels mobiles représentent un parcours principal, pas seulement un raccourci vers le dashboard. |

## Prototype B2B cible

Le premier prototype mobile ne doit pas chercher à reproduire tout PRONTO. Il doit proposer quatre missions à forte fréquence : consultation des performances, réponse aux demandes, publication rapide d’un élément de catalogue et partage de la vitrine. Le modèle de données, les règles de rôles et les API tRPC actuelles restent le socle métier ; les sessions devront évoluer vers des sessions par appareil révocables, avec stockage sécurisé des jetons et deep links signés.

Avant une soumission en store, le produit devra disposer d’une politique de confidentialité vérifiable, des écrans de suppression de compte et de données lorsque requis, d’un traitement explicite des permissions appareil, d’une politique de contenu pour les médias clients, et d’un protocole de test iOS/Android. Aucun délai ni coût de store n’est fixé dans ce document : ils dépendront du périmètre retenu et des comptes développeur.

## Références

[1]: https://supabase.com/docs/guides/database/overview "Supabase — Database overview"
[2]: https://vercel.com/docs/deployments "Vercel — Deploying to Vercel"
[3]: https://manychat.com/product/instagram "ManyChat — Instagram automation"
[4]: https://manychat.com/blog/whatsapp-automation-marketing/ "ManyChat — WhatsApp automation marketing"
[5]: https://web.dev/learn/pwa/progressive-web-apps "web.dev — Progressive Web Apps"
[6]: https://capacitorjs.com/docs/ "Capacitor — Cross-platform Native Runtime for Web Apps"
[7]: https://expo.dev/ "Expo — React Native framework and application services"
