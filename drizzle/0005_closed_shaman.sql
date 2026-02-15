CREATE TABLE `advertisements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`imageUrl` text NOT NULL,
	`linkUrl` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advertisements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `restaurants` RENAME COLUMN `subscriptionStartDate` TO `subscriptionExpiresAt`;--> statement-breakpoint
ALTER TABLE `restaurants` MODIFY COLUMN `subscriptionStatus` enum('active','trial','expired','cancelled') NOT NULL DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE `restaurants` ADD `subscriptionTier` enum('menu','pro','premium') DEFAULT 'menu' NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `showAds` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurants` ADD `featuresEnabled` json DEFAULT ('{"events":true,"reservations":true,"translations":true}');--> statement-breakpoint
ALTER TABLE `restaurants` DROP COLUMN `subscriptionPlan`;--> statement-breakpoint
ALTER TABLE `restaurants` DROP COLUMN `subscriptionEndDate`;