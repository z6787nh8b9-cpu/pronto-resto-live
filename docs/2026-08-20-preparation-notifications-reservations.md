# Préparation des notifications de réservation

## État actuel

PRONTO enregistre les préférences `notifyByEmail` et `notifyByWhatsApp` dans les réglages de réservation, mais aucun fournisseur externe n’est actuellement configuré ni appelé. Ce comportement est volontaire : une réservation est enregistrée selon les règles de capacité, sans qu’une confirmation Email ou WhatsApp soit annoncée à tort.

## Contrat à préserver

Le futur envoi doit être déclenché uniquement après l’écriture atomique de la réservation. Un échec de fournisseur ne doit ni annuler une réservation créée, ni permettre une seconde création du même créneau. Les données transmises doivent se limiter à l’établissement, la date, le nombre de personnes et les coordonnées explicitement fournies par le client.

| Canal | Décision à prendre | Secret requis avant activation |
|---|---|---|
| Email | Choisir un fournisseur transactionnel et une adresse expéditrice vérifiée | Clé API du fournisseur, adresse expéditrice, domaine de retour si nécessaire |
| WhatsApp | Choisir un fournisseur Business/API et les modèles de message requis | Jeton API, identifiant expéditeur, identifiant de modèle si requis |

## Conditions avant implémentation

L’intégration doit rester désactivée par défaut tant qu’un fournisseur n’est pas validé. Elle devra inclure une journalisation minimale de l’état d’envoi, une stratégie de reprise sans doublon et des tests de non-envoi lorsque les secrets sont absents. L’interface publique conservera un wording factuel : elle ne promettra une notification qu’une fois un canal réellement activé.
