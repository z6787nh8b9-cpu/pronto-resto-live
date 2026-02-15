CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`entityType` enum('restaurant','category','item') NOT NULL,
	`entityId` int NOT NULL,
	`field` varchar(100) NOT NULL,
	`language` enum('fr','en','it','de','es') NOT NULL,
	`originalText` text NOT NULL,
	`translatedText` text NOT NULL,
	`isAutoTranslated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
