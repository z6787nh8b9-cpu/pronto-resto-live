# Audit visuel des interfaces prioritaires — PRONTO

## Périmètre inspecté

La landing, le centre de contrôle Super Admin et l’espace entreprise de La Voile Rouge ont été examinés dans l’environnement de développement. Les deux dashboards conservent une identité éditoriale cohérente : fonds chaleureux, hero brun profond, typographie serif pour les messages de pilotage et surfaces d’action aérées.

| Surface | Observation | Priorité |
|---|---|---|
| Centre de contrôle Super Admin | La hiérarchie est claire et les accès principaux sont immédiatement lisibles. La rangée d’onglets devient dense mais reste utilisable sur grand écran. | P2 : revue mobile dédiée |
| Espace entreprise | Les actions de premier niveau sont cohérentes avec la promesse de pilotage. Le premier rendu visuel a toutefois affiché `0` collection et `0` élément avant l’arrivée des données alors que les données chargées indiquent des valeurs réelles. | P0 : ne pas présenter de compteurs à zéro pendant le chargement |
| Landing | La composition éditoriale, le hero et les CTA sont déjà cohérents avec la direction premium retenue. | P2 : revue mobile et navigation secondaire |

## Décision d’audit

Le prochain correctif doit traiter l’état de chargement des indicateurs d’espace entreprise. Une valeur nulle est une information métier, pas un placeholder : elle ne doit être affichée qu’après résolution des requêtes. Les compteurs doivent employer une surface de chargement non trompeuse, tout en préservant l’espace de mise en page et l’accessibilité.

## Validation du correctif P0

Les compteurs Collections actives et Éléments publiables affichent désormais une surface de chargement dédiée tant que leurs requêtes ne sont pas résolues. Une fois les données reçues, la revue navigateur confirme l’affichage des valeurs réelles `15` et `101` dans la hiérarchie existante. L’état vide réel reste donc distingué de l’état de chargement.

## Revue smartphone

La capture à 390 px confirme que le dashboard conserve une colonne de lecture claire : hero, indicateurs, actions principales et onboarding se suivent sans débordement horizontal. Les indicateurs sont volontairement empilés, ce qui préserve leur lisibilité. Les onglets restent compacts et défilables horizontalement ; une future itération pourra rendre plus explicite l’existence des onglets hors champ, mais aucun correctif bloquant n’est requis pour ce jalon.

L’indice de défilement a été ajouté et contrôlé sur smartphone : un fondu latéral ainsi qu’une instruction explicite signalent les sections accessibles hors du premier segment d’onglets. Le contrôle reste non interactif et ne perturbe ni le défilement tactile ni la navigation au clavier.
