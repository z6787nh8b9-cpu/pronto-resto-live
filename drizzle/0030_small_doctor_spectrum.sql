CREATE TABLE `business_onboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`industry` varchar(100),
	`primaryGoal` varchar(120),
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedSteps` json NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_onboarding_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_onboarding_businessId_unique` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`uploadedByType` enum('admin','owner','system') NOT NULL,
	`uploadedById` int,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(127) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE INDEX `business_onboarding_status_idx` ON `business_onboarding` (`status`);--> statement-breakpoint
CREATE INDEX `media_assets_business_idx` ON `media_assets` (`businessId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `media_assets_uploader_idx` ON `media_assets` (`uploadedByType`,`uploadedById`);