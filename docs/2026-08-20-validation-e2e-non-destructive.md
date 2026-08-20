# Validation e2e non destructive — état intermédiaire

| Parcours | Résultat observé | Portée |
|---|---|---|
| Connexion propriétaire e-mail | Le compte propriétaire autorisé a été redirigé vers `/<slug>/dashboard` après authentification. | Connexion locale et résolution du dashboard associée. |
| Dashboard La Voile Rouge | Le dashboard s’est chargé avec l’onglet Aperçu, le catalogue, les paramètres et les modules de formule visibles. | Lecture seule, aucune mutation déclenchée. |
| Vitrine La Voile Rouge | La route `/<slug>` a chargé le hero, le catalogue mis en avant, les coordonnées, le chatbot et l’attribution PRONTO by ALTMachine. | Lecture publique, aucune mutation déclenchée. |
| Conditions d’utilisation | La route `/terms` affiche sa page informative et propose un retour vers `/login-restaurant`. | Le lien de connexion ne conduit plus à une route inexistante. |
| Catalogue La Voile Rouge | La route `/<slug>/menu` a chargé la recherche, les filtres alimentaires, les catégories et les éléments publiables. | Lecture publique, aucune mutation déclenchée. |
| Traductions sur formule Menu | Le catalogue de La Voile Rouge ne présente pas de sélecteur de langue dans son chrome public. | Comportement cohérent avec une fonction de traduction réservée aux formules Pro et Premium. |

La validation reste intermédiaire : les scénarios de mutation critique, d’invitation, de suspension et de réservations ne sont pas exécutés dans ce passage non destructif.
