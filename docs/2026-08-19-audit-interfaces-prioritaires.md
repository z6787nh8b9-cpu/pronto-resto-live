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

## Cohérence multi-secteurs du dashboard

Le libellé visible de l’onglet `Catalogue`, son en-tête et son aide contextuelle ont été généralisés. La revue navigateur confirme ce wording dans le dashboard La Voile Rouge, tandis que l’identifiant interne `menu` reste inchangé : les URL, l’état d’onglet et les procédures legacy restent donc compatibles.

## Première revue mobile Super Admin

La capture à 390 px confirme un hero compact, des indicateurs empilés lisibles et des actions principales adaptées à la largeur mobile. Elle affiche cependant une superposition apparente du header au milieu du document. Comme la capture de contrôle défile volontairement avant de produire une image longue, ce comportement est traité comme un possible artefact de composition tant qu’il n’est pas reproduit dans une capture de viewport fixe. Une vérification ciblée au premier viewport est requise avant tout changement de composant.

La vérification du viewport mobile fixe ne reproduit pas cette superposition : le logo, l’action de création, l’intitulé, les onglets et le hero sont correctement séparés. Le phénomène observé dans l’image longue est donc un artefact de capture après défilement, et aucun correctif de header n’est nécessaire.

## Catalogue public

Le catalogue La Voile Rouge reste lisible sur bureau et smartphone : recherche, filtres, catégories défilables et prix sont hiérarchisés proprement. Le premier viewport mobile ne présente aucun débordement. Le hero sans image de couverture repose toutefois sur un gris neutre qui affaiblit la continuité avec la vitrine et la direction éditoriale PRONTO. La priorité retenue est d’appliquer le même repli contrasté et texturé que sur la vitrine historique, sans modifier les cas qui disposent d’une vraie image de couverture.

La vérification technique a révélé qu’une URL de couverture historique était indisponible. Le catalogue détecte désormais l’échec de chargement et bascule automatiquement vers son fond radial contrasté. Les revues bureau et smartphone confirment un hero lisible, cohérent avec la vitrine et sans rupture de mise en page.

Les cartes de catalogue n’affichent désormais l’intitulé d’allergènes que si une liste utile est effectivement renseignée. La revue navigateur confirme la suppression des libellés vides sur les entrées de La Voile Rouge, avec des descriptions et prix conservés dans une lecture plus nette.

Le script reCAPTCHA n’est plus injecté globalement dans la landing de développement. La revue navigateur confirme la disparition de l’avertissement de clé de site, tandis que le formulaire conserve son jeton de développement côté client et charge la protection Google uniquement pour une soumission de production.

L’assistance flottante de la landing a été compactée et déplacée vers le bord inférieur mobile. La capture à 390 px confirme que les deux CTA du hero restent entièrement visibles et activables, tout en maintenant un accès rapide à l’assistance.

La navigation de catégories du catalogue affiche maintenant un état actif renforcé, un fondu latéral sur la rangée défilable et une instruction lisible sous cette rangée. La revue à 390 px confirme que les catégories hors champ sont signalées sans masquer l’instruction ni gêner la sélection existante.
