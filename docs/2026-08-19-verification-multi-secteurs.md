# Vérification multi-secteurs — aperçus isolés

Les aperçus protégés ont été vérifiés sur l’environnement de développement avec une session Super Admin autorisée. Les références sont en brouillon, portent l’étiquette explicite « Aperçu Super Admin — non publié » et restent refusées par le contrat public.

| Secteur | Référence isolée | Variantes vérifiées | État |
|---|---|---|---|
| Beauté | Atelier Éclat | Tarif « à partir de », durée, prestation sur devis | Conforme |
| Retail | Maison Objets | Prix fixe, fourchette de prix | Conforme |
| Services | Studio Conseil | Prestation de service et variant gratuit | Conforme |

La structure de vitrine reste cohérente entre les secteurs : navigation flottante, hero sombre et lisible, collections ou prestations, cartes à double contour et indication de prix contextualisée. Aucun aperçu brouillon n’est rendu disponible via la route publique.

## Contrôle bureau complémentaire

Le 19 août 2026, les aperçus beauté, retail et services ont été revus directement dans le navigateur sur grand écran. Le badge brouillon, le chrome flottant, le hero contrasté et les surfaces concentriques restent lisibles. Les valeurs « À partir de », « Sur devis », « Sans frais », prix fixe et fourchette de prix sont rendues avec un niveau de hiérarchie cohérent. La vitrine services restitue notamment la durée de l’échange découverte, sans introduire de vocabulaire restaurant.

Les trois aperçus restent réservés à une session Super Admin. Les données de démonstration demeurent en statut `draft` en base, ce qui conserve leur refus par la route publique.

## Régression restaurant historique

La vitrine La Voile Rouge conserve ses contrôles de langue, menu, réservation et contact après l’adoption du chrome flottant commun. Quand aucune image de couverture n’est renseignée, un fond radial sombre et contrasté prend désormais le relais afin de préserver la lisibilité du hero. Le chargement fonctionnel a été vérifié dans le navigateur ; une capture de la vue a été rendue indisponible par une réinitialisation ponctuelle du navigateur, sans erreur applicative associée.

Une capture Chromium en largeur smartphone (390 px) confirme également le repli de hero, la troncature saine du chrome flottant et l’espacement entre le bouton de chat et le badge reCAPTCHA. Les actions flottantes restaurant sont relevées sur mobile et reviennent à leur position compacte à partir du format `sm`.

La même revue mobile sur la vitrine beauté confirme que les tarifs génériques se placent sous le nom de la prestation avant le breakpoint `sm`. Ils restent ainsi dans la colonne de lecture, sans compétition visuelle avec le badge reCAPTCHA, tout en reprenant l’alignement latéral sur bureau.

Les collections et cartes génériques bénéficient désormais d’une révélation unique à leur entrée dans le viewport. Elle s’appuie sur `IntersectionObserver`, n’ajoute aucun écouteur de scroll continu et conserve la visibilité immédiate avec la préférence de mouvement réduit. Une capture mobile après défilement confirme la restitution des collections situées sous le premier viewport.
