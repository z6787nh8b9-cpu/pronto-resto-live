# Validation e2e non destructive — état intermédiaire

| Parcours | Résultat observé | Portée |
|---|---|---|
| Connexion propriétaire e-mail | Le compte propriétaire autorisé a été redirigé vers `/<slug>/dashboard` après authentification. | Connexion locale et résolution du dashboard associée. |
| Dashboard La Voile Rouge | Le dashboard s’est chargé avec l’onglet Aperçu, le catalogue, les paramètres et les modules de formule visibles. | Lecture seule, aucune mutation déclenchée. |
| Vitrine La Voile Rouge | La route `/<slug>` a chargé le hero, le catalogue mis en avant, les coordonnées, le chatbot et l’attribution PRONTO by ALTMachine. | Lecture publique, aucune mutation déclenchée. |
| Conditions d’utilisation | La route `/terms` affiche sa page informative et propose un retour vers `/login-restaurant`. | Le lien de connexion ne conduit plus à une route inexistante. |

La validation reste intermédiaire : les scénarios de mutation critique, d’invitation, de suspension et de réservations ne sont pas exécutés dans ce passage non destructif.
