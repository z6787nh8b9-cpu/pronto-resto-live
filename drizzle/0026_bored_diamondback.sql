CREATE TABLE `business_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`principalType` enum('restaurant_owner','admin_account','manus_user') NOT NULL,
	`principalId` int NOT NULL,
	`role` enum('owner','administrator','editor','publisher','analyst','support') NOT NULL DEFAULT 'editor',
	`status` enum('active','invited','suspended') NOT NULL DEFAULT 'active',
	`invitedByPrincipalId` int,
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_members_principal_unique` UNIQUE(`businessId`,`principalType`,`principalId`)
);
--> statement-breakpoint
CREATE TABLE `business_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`displayName` varchar(255),
	`shortDescription` text,
	`email` varchar(320),
	`phone` varchar(32),
	`whatsapp` varchar(32),
	`address` text,
	`logoUrl` text,
	`heroImageUrl` text,
	`primaryColor` varchar(16) DEFAULT '#7D3A31',
	`accentColor` varchar(16) DEFAULT '#FF9999',
	`fontFamily` varchar(100) DEFAULT 'Playfair Display',
	`locale` varchar(10) NOT NULL DEFAULT 'fr',
	`socialLinks` json,
	`seoTitle` varchar(255),
	`seoDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_profiles_businessId_unique` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`legacyRestaurantId` int,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`vertical` enum('restaurant','beauty','retail','service','events','other') NOT NULL DEFAULT 'other',
	`status` enum('draft','published','archived','suspended') NOT NULL DEFAULT 'draft',
	`subscriptionTier` enum('menu','pro','premium') NOT NULL DEFAULT 'menu',
	`subscriptionStatus` enum('active','trial','expired','cancelled') NOT NULL DEFAULT 'trial',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_legacyRestaurantId_unique` UNIQUE(`legacyRestaurantId`),
	CONSTRAINT `businesses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogId` int NOT NULL,
	`legacyMenuCategoryId` int,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`status` enum('active','hidden','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_collections_legacyMenuCategoryId_unique` UNIQUE(`legacyMenuCategoryId`),
	CONSTRAINT `catalog_collections_catalog_slug_unique` UNIQUE(`catalogId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogId` int NOT NULL,
	`collectionId` int,
	`legacyMenuItemId` int,
	`itemType` enum('product','service','package','event') NOT NULL DEFAULT 'product',
	`name` varchar(255) NOT NULL,
	`description` text,
	`priceType` enum('fixed','from','range','quote','free') NOT NULL DEFAULT 'fixed',
	`price` decimal(10,2),
	`priceMax` decimal(10,2),
	`priceLabel` varchar(100),
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`durationMinutes` int,
	`imageUrl` text,
	`attributes` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`status` enum('active','hidden','archived') NOT NULL DEFAULT 'active',
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalog_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalog_items_legacyMenuItemId_unique` UNIQUE(`legacyMenuItemId`)
);
--> statement-breakpoint
CREATE TABLE `catalogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`legacyRestaurantId` int,
	`slug` varchar(100) NOT NULL,
	`type` enum('menu','services','products','price_list','portfolio','events') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`isPrimary` boolean NOT NULL DEFAULT false,
	`displayOrder` int NOT NULL DEFAULT 0,
	`source` enum('manual','legacy_migration','csv_import','document_import','image_import') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `catalogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `catalogs_business_slug_unique` UNIQUE(`businessId`,`slug`)
);
--> statement-breakpoint
CREATE INDEX `business_members_business_idx` ON `business_members` (`businessId`);--> statement-breakpoint
CREATE INDEX `catalog_collections_catalog_order_idx` ON `catalog_collections` (`catalogId`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `catalog_items_catalog_collection_order_idx` ON `catalog_items` (`catalogId`,`collectionId`,`displayOrder`);--> statement-breakpoint
CREATE INDEX `catalog_items_legacy_menu_item_idx` ON `catalog_items` (`legacyMenuItemId`);--> statement-breakpoint
CREATE INDEX `catalogs_business_status_idx` ON `catalogs` (`businessId`,`status`);
