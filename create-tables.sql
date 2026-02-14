CREATE TABLE IF NOT EXISTS `restaurants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`whatsapp` varchar(20),
	`reservationUrl` text,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`logoUrl` text,
	`heroImageUrl` text,
	`primaryColor` varchar(7) DEFAULT '#7D3A31',
	`accentColor` varchar(7) DEFAULT '#FF9999',
	`fontFamily` varchar(100) DEFAULT 'Playfair Display',
	`subscriptionPlan` enum('basic','premium') NOT NULL DEFAULT 'basic',
	`subscriptionStatus` enum('active','inactive','trial') NOT NULL DEFAULT 'trial',
	`subscriptionStartDate` timestamp NULL,
	`subscriptionEndDate` timestamp NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE IF NOT EXISTS `menuCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuCategories_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `menuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`imageUrl` text,
	`isVegetarian` boolean NOT NULL DEFAULT false,
	`isVegan` boolean NOT NULL DEFAULT false,
	`isGlutenFree` boolean NOT NULL DEFAULT false,
	`allergens` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `chatbotConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`tone` enum('formal','warm','casual') NOT NULL DEFAULT 'warm',
	`customInfo` text,
	`welcomeMessage` text,
	`totalConversations` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbotConfigs_restaurantId_unique` UNIQUE(`restaurantId`)
);

CREATE TABLE IF NOT EXISTS `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`userMessage` text NOT NULL,
	`aiResponse` text NOT NULL,
	`userIp` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `pageViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`visitorIp` varchar(45),
	`userAgent` text,
	`referer` text,
	`path` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `pageViews_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `subscriptionTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`plan` enum('basic','premium') NOT NULL,
	`stripePaymentId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionTransactions_id` PRIMARY KEY(`id`)
);
