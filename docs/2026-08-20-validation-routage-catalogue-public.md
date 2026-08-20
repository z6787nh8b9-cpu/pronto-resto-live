# Validation non destructive du routage catalogue public

Date de contrôle : 20 août 2026.

La route `/:slug/menu` a été ouverte sur l’environnement de développement avec l’établissement La Voile Rouge. Après stabilisation de la requête publique, la page affiche son en-tête de vitrine, les filtres, les onglets de catégories, les éléments de catalogue, le bloc partenaire applicable et l’attribution PRONTO by ALTMachine.

Le premier rendu transitoire ne contenait aucune collection, puis l’état chargé a affiché les catégories et plats attendus. Aucune mutation, connexion ou action de gestion n’a été déclenchée pendant ce contrôle.

| Élément contrôlé | Résultat |
|---|---|
| Route catalogue `/:slug/menu` | Accessible et rendue comme page dédiée |
| Catégories et éléments publics | Chargés après stabilisation |
| Attribution | Présente : PRONTO by ALTMachine |
| Opérations mutantes | Aucune |

Deux contrôles complémentaires ont confirmé que `/:slug/events` rend l’agenda dédié avec ses retours vers l’accueil et le catalogue, tandis que `/tarifs` rend la page tarifaire PRONTO plutôt que d’être interprétée comme le slug d’un établissement. Aucun événement n’était programmé pour La Voile Rouge au moment du contrôle ; l’état vide et le retour à la vitrine ont été affichés.

| Route complémentaire | Résultat |
|---|---|
| Agenda `/:slug/events` | Accessible, en-tête dédié et état vide cohérent |
| Tarifs `/tarifs` | Accessible, page tarifaire dédiée servie avant la route générique |
