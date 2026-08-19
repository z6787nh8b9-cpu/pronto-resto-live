# Audit de découplage Manus — PRONTO

## Conclusion initiale

Les parcours métier PRONTO peuvent fonctionner sans **Manus OAuth** : les comptes propriétaires reposent déjà sur Passport, Google/Facebook et les comptes email locaux ; le Super Admin repose déjà sur `admin_accounts` et une session PRONTO. Ces éléments peuvent donc être découplés sans migration de comptes.

En revanche, certaines capacités servent encore de passerelle vers des services Manus/Forge. Elles ne doivent pas être supprimées sans remplacement, car cela casserait des fonctions produit plutôt que de simples détails techniques.

| Élément inventorié | Type | Décision | Conséquence |
|---|---|---|---|
| `client/src/const.ts`, `useAuth`, `DashboardLayout`, `ManusDialog` | Redirection et marque Manus côté client | **À retirer** | Évite tout renvoi inattendu hors PRONTO. |
| `/api/oauth/callback`, `sdk.ts`, utilisateur `ctx.user`, principal `platform` | Manus OAuth applicatif | **À retirer** | Les droits métier devront exclusivement utiliser propriétaire et Super Admin local. |
| `admin.ts` : fusion des admins issus de `users` | Administration héritée | **À retirer** | Le Super Admin restera basé sur `admin_accounts`. |
| `vite-plugin-manus-runtime` et collecteur de debug Manus | Build et développement | **À retirer ou remplacer par un collecteur neutre** | Aucun impact fonctionnel attendu sur les vitrines ou comptes PRONTO. |
| `/manus-storage/*`, `storageProxy.ts`, `storagePut` | Stockage média | **À remplacer avant retrait** | Sinon les médias existants et futurs ne peuvent plus être servis ou téléversés. |
| `llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `dataApi.ts`, `map.ts` | IA, import, carte et traitement média | **À remplacer ou isoler** | Leur retrait direct désactive chatbot, import assisté, génération et intégrations cartographiques. |
| `notification.ts` | Notification au propriétaire de projet | **À remplacer** | Les alertes techniques doivent passer vers email, webhook ou fournisseur choisi. |
| Hébergement, preview et domaine `*.manus.space` | Infrastructure | **Structurel au déploiement actuel** | Un retrait complet implique une migration d’hébergement, de base d’environnement et éventuellement de CI/CD. |

## Ordre de retrait retenu

Le premier passage retire **Manus de l’expérience PRONTO** : redirections, OAuth applicatif, rôles plateforme, UI et diagnostics. Il conserve temporairement les adaptateurs Forge uniquement derrière le serveur pour que les fonctions IA, import, carte, stockage et notification restent opérationnelles.

Le deuxième passage nécessitera une décision de fournisseur : stockage S3 indépendant, LLM/API IA, cartographie, email/webhook et hébergement. Cette étape sera explicitement chiffrée et proposée avant toute suppression irréversible, car elle modifie les opérations du produit et non seulement son code.

> Aucune route métier propriétaire, Super Admin ou vitrine publique ne doit rediriger vers Manus après le premier passage de découplage.
