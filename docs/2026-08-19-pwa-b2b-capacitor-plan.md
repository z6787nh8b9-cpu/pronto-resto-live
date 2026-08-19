# PWA B2B et trajectoire Capacitor — plan d’exécution

## Décision de mise en œuvre

PRONTO adoptera d’abord une **PWA B2B installable**. Ce socle conservera les routes, l’authentification et l’API existantes, tout en apportant un manifeste, un service worker, une stratégie de cache limitée aux ressources applicatives et une signalétique d’installation. La PWA ne stockera jamais de jeton d’authentification dans son cache.

Capacitor viendra ensuite entourer le même bundle web, sans fork du frontend. La documentation officielle indique que Capacitor peut être ajouté à une application JavaScript moderne qui possède un `package.json`, un répertoire de build séparé et un `index.html`; le bundle web est ensuite synchronisé vers les projets iOS et Android.[1]

| Étape | Livrable | Règle de sécurité |
|---|---|---|
| PWA | `manifest.webmanifest`, service worker, cache des assets hashés et page hors ligne | Ne pas mettre en cache les réponses API authentifiées, les écrans dashboard ou les données d’entreprise. |
| Installabilité | Métadonnées, icônes, couleur thème, raccourci vers l’espace entreprise | Aucun écran ne doit prétendre fonctionner hors connexion s’il dépend d’une mutation serveur. |
| Capacitor | Configuration `webDir: dist`, identifiant de bundle réservé, scripts de synchronisation | Pas de clé de signature, de certificat ou de fichier `.well-known` définitif avant création des comptes stores et des identifiants officiels. |
| Deep links | Routes web conservées pour retombée navigateur et liens app | Ajouter les fichiers d’association seulement après réception du Team ID Apple, package Android et empreinte SHA-256 du certificat. |

## Périmètre B2B de la première version

La première application installable se concentre sur la consultation de la vitrine, le catalogue, les demandes et les statistiques. Les opérations sensibles de compte, de rôles, de mots de passe et de facturation restent accessibles au serveur existant et exigent une session active. Les notifications push, l’appareil photo et le fonctionnement hors ligne transactionnel sont différés jusqu’à la validation de l’usage terrain.

> Une PWA requiert un manifeste et un service worker ; les documentations Capacitor recommandent d’utiliser un outil dédié plutôt que d’écrire un service worker complexe à la main.[2]

## Prérequis stores à ne pas anticiper artificiellement

Le projet Capacitor ne sera ajouté avec `ios/` et `android/` qu’après confirmation de l’identifiant de bundle, des comptes Apple Developer et Google Play, et de la politique de confidentialité mobile. Capacitor traite les projets natifs comme faisant partie du code source, donc ils devront être versionnés une fois créés.[3]

Les Universal Links et Android App Links reposent sur des fichiers HTTPS placés dans `.well-known`, avec des identifiants Apple et Android propres à l’application. Ils seront préparés sous forme de modèles documentés, mais non publiés avant la délivrance des identifiants de signature.[4]

## Références

[1]: https://capacitorjs.com/docs/getting-started "Capacitor — Installing Capacitor"
[2]: https://capacitorjs.com/docs/web/progressive-web-apps "Capacitor — Building Progressive Web Apps"
[3]: https://capacitorjs.com/solution/react "Capacitor — React & Capacitor"
[4]: https://capacitorjs.com/docs/guides/deep-links "Capacitor — Deep Linking with Universal and App Links"
