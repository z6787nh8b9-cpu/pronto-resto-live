# Audit de découplage Manus — PRONTO

## Conclusion initiale

Les parcours métier PRONTO peuvent fonctionner sans **Manus OAuth** : les comptes propriétaires reposent déjà sur Passport, Google/Facebook et les comptes email locaux ; le Super Admin repose déjà sur `admin_accounts` et une session PRONTO. Ces éléments peuvent donc être découplés sans migration de comptes.

En revanche, certaines capacités servent encore de passerelle vers des services Manus/Forge. Elles ne doivent pas être supprimées sans remplacement, car cela casserait des fonctions produit plutôt que de simples détails techniques.

| Élément inventorié | Type | Décision | Conséquence |
|---|---|---|---|
| `client/src/const.ts`, `useAuth`, `DashboardLayout`, `ManusDialog` | Redirection et marque Manus côté client | **À retirer** | Évite tout renvoi inattendu hors PRONTO. |
| `/api/oauth/callback`, `sdk.ts`, utilisateur `ctx.user`, principal `platform` | Manus OAuth applicatif | **À retirer** | Les droits métier devront exclusivement utiliser propriétaire et Super Admin local. |
| `admin.ts` : fusion des admins issus de `users` | Administration héritée | **À retirer** | Le Super Admin restera basé sur `admin_accounts`. |
| Runtime Vite, collecteur de debug et analytique Manus | Build et développement | **Retirés** | Le bundle PWA de production est contrôlé sans référence Manus visible. |
| `/manus-storage/*`, `storageProxy.ts`, `storagePut` | Stockage média | **À remplacer avant retrait** | Sinon les médias existants et futurs ne peuvent plus être servis ou téléversés. |
| `llm.ts`, `imageGeneration.ts`, `voiceTranscription.ts`, `dataApi.ts`, `map.ts` | IA, import, carte et traitement média | **À remplacer ou isoler** | Leur retrait direct désactive chatbot, import assisté, génération et intégrations cartographiques. |
| `notification.ts` | Notification au propriétaire de projet | **À remplacer** | Les alertes techniques doivent passer vers email, webhook ou fournisseur choisi. |
| Hébergement, preview et domaine `*.manus.space` | Infrastructure | **Structurel au déploiement actuel** | Un retrait complet implique une migration d’hébergement, de base d’environnement et éventuellement de CI/CD. |

## Ordre de retrait retenu

Le premier passage retire **Manus de l’expérience PRONTO** : redirections, OAuth applicatif, rôles plateforme, UI et diagnostics. Il conserve temporairement les adaptateurs Forge uniquement derrière le serveur pour que les fonctions IA, import, carte, stockage et notification restent opérationnelles.

Le deuxième passage nécessitera une décision de fournisseur : stockage S3 indépendant, LLM/API IA, cartographie, email/webhook et hébergement. Cette étape sera explicitement chiffrée et proposée avant toute suppression irréversible, car elle modifie les opérations du produit et non seulement son code.

## État après premier passage

Le bundle public, les routes de connexion PRONTO, le callback OAuth applicatif et la supervision métier ne redirigent plus vers Manus. Les références restantes sont confinées aux adaptateurs serveur d’IA, de stockage, de carte et de notification, ainsi qu’aux paramètres d’hébergement nécessaires au déploiement actuel. Elles ne sont pas accessibles dans le bundle navigateur et sont documentées pour migration différée.

Le contrôle HTTP de `pronto.page` confirme les protections de transport attendues — HSTS, politique de permissions, politique de référent, anti-clickjacking et protection MIME. La réponse porte encore l’en-tête technique `x-manus-proxy-mode: transparent/1`, injecté par l’infrastructure d’hébergement. Cet en-tête ne provient pas du code PRONTO, n’est pas rendu par l’interface et ne peut disparaître qu’avec une migration d’hébergement ; il ne remet pas en cause l’autonomie des parcours applicatifs.

La table de compatibilité historique `users` est actuellement inutilisée par les routeurs applicatifs et ne participe plus à une décision de droit. Elle contient néanmoins des enregistrements historiques ; elle est donc conservée en lecture passive jusqu’à validation d’une politique de rétention et d’une suppression ou d’un archivage explicitement décidé. Aucun retrait destructif n’a été effectué dans ce jalon.

> Aucune route métier propriétaire, Super Admin ou vitrine publique ne doit rediriger vers Manus après le premier passage de découplage.
