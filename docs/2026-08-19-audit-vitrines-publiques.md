# Audit visuel — vitrines publiques PRONTO

**Périmètre observé :** pages publiques La Voile Rouge (`/:slug` et `/:slug/menu`), vues bureau, 19 août 2026.

## Constats prioritaires

| Priorité | Constat | Effet observé | Correction attendue |
|---|---|---|---|
| P0 | Les deux pages utilisent des châssis, rayons, boutons et couches de navigation différents. | La navigation et le catalogue ne semblent pas appartenir à la même vitrine. | Créer un chrome public commun avec une île de navigation flottante et des tokens partagés. |
| P0 | La page d’accueil emploie un header rectangulaire collé à la fenêtre, un hero en `h-[70vh]` et des boutons `rounded-none`. | Hiérarchie lourde, comportement moins robuste sur mobile et rendu contraire au langage matériel visé. | Passer à `min-h-[100dvh]`, une barre flottante, des CTA pilules à double contour et un hero à voile sombre stable. |
| P0 | La page catalogue mélange une image hero floue avec une liste de cartes très plates et des actions flottantes dissociées. | Matériaux, densité et profondeur incohérents ; les appels à l’action concurrencent le contenu. | Introduire des surfaces à double contour, une zone d’actions unifiée et une échelle de profondeur limitée. |
| P1 | L’image pleine page de publicité, les actions flottantes et les contenus publics s’appuient sur plusieurs z-index élevés. | Risque récurrent de masquage ou de superposition, déjà rencontré sur les formats publicitaires. | Définir une échelle de couches unique et réserver les niveaux élevés aux surfaces modales. |
| P1 | Les collections sont nombreuses et seulement défilables horizontalement, sans repère actif fort ni résumé de contenu. | Parcours difficile lorsque le catalogue comporte beaucoup de collections. | Renforcer l’état actif, la hiérarchie des collections et le retour de recherche sans masquer le défilement mobile. |
| P1 | Chatbot, WhatsApp, langue et réservations sont traités comme éléments séparés. | Multiplication d’actions flottantes et de priorités visuelles. | Composer une seule zone d’actions contextuelle, accessible et respectueuse de la réduction des animations. |

## Principes de refonte retenus

La refonte visera un **éditorial chaleureux**, multi-secteurs, avec la combinaison suivante : un fond ivoire texturé très discret, une typographie serif déjà fournie pour les titres et une sans-serif fonctionnelle pour les informations. Les sections respireront davantage, tandis que les surfaces interactives adopteront une architecture à double contour : coque légère, cœur lisible, rayon concentrique et ombres diffuses.

La navigation sera une surface flottante distincte du haut de page. Les animations d’entrée devront reposer sur `IntersectionObserver`, `transform` et `opacity`, et une préférence de mouvement réduit remplacera les décalages par des fondus courts. Aucun conteneur défilant ne recevra de `backdrop-filter` ou de flou coûteux.

## Éléments à préserver

La refonte ne doit pas modifier les routes existantes, les URLs des médias, les données de catalogue, les filtres, l’accessibilité clavier, les formats publicitaires ni les parcours de réservation, d’événement et de chatbot. L’affichage conditionnel des coordonnées et horaires doit rester inchangé.

## Validation intermédiaire — page d’accueil

Le 19 août 2026, la vitrine de développement de La Voile Rouge a été contrôlée après introduction du chrome partagé. La barre est désormais une surface flottante lisible au-dessus de l’image, le hero respecte une hauteur mobile `100dvh`, l’arrière-plan flouté ne révèle pas de bord blanc et le titre conserve un contraste suffisant. Le catalogue reste à aligner sur ce même langage avant validation finale.

Le catalogue a ensuite été contrôlé avec ce même chrome. La barre, le hero et l’ancrage des collections sont cohérents avec l’accueil. Les cartes, filtres, actions contextuelles et formats publicitaires restent à uniformiser dans la suite de la refonte.

Après l’itération suivante, les filtres, l’onglet actif et les cartes de catalogue utilisent des contours concentriques et une profondeur légère cohérente avec le chrome. Le contraste reste lisible et les collections conservent leur défilement horizontal sans changer de données ni de route.
