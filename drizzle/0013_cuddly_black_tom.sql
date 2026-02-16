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
CREATE TABLE `chatbotConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`tone` enum('formal','warm','casual') NOT NULL DEFAULT 'warm',
	`customInfo` text,
	`welcomeMessage` text,
	`totalConversations` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConfigs_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbotConfigs_restaurantId_unique` UNIQUE(`restaurantId`)
);
--> statement-breakpoint
CREATE TABLE `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`userMessage` text NOT NULL,
	`aiResponse` text NOT NULL,
	`userIp` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`restaurantId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`numberOfPeople` int NOT NULL DEFAULT 1,
	`specialRequests` text,
	`status` enum('pending','confirmed','cancelled','attended','no_show') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`paymentAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`confirmationToken` varchar(100),
	`confirmedAt` timestamp,
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`eventDate` timestamp NOT NULL,
	`duration` int NOT NULL DEFAULT 120,
	`maxAttendees` int NOT NULL,
	`currentAttendees` int NOT NULL DEFAULT 0,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
	`isVisible` boolean NOT NULL DEFAULT true,
	`requiresApproval` boolean NOT NULL DEFAULT false,
	`registrationDeadline` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gallery_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`caption` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gallery_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`emoji` varchar(10) DEFAULT '🍴',
	`imageUrl` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menuItems` (
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
	`allergens` json DEFAULT ('[]'),
	`ingredients` text,
	`nutritionalInfo` json,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menuItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opening_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`openTime` varchar(5),
	`closeTime` varchar(5),
	`isClosed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opening_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pageViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`visitorIp` varchar(45),
	`userAgent` text,
	`referer` text,
	`path` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pageViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`slotDuration` int NOT NULL DEFAULT 30,
	`advanceBookingDays` int NOT NULL DEFAULT 30,
	`minAdvanceHours` int NOT NULL DEFAULT 2,
	`defaultTableSize` int NOT NULL DEFAULT 4,
	`maxPartySize` int NOT NULL DEFAULT 12,
	`notifyByEmail` boolean NOT NULL DEFAULT true,
	`notifyByWhatsApp` boolean NOT NULL DEFAULT true,
	`autoConfirm` boolean NOT NULL DEFAULT false,
	`confirmationMessage` text,
	`cancellationPolicy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservation_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservation_settings_restaurantId_unique` UNIQUE(`restaurantId`)
);
--> statement-breakpoint
CREATE TABLE `reservation_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`capacity` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservation_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`zoneId` int,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`reservationDate` timestamp NOT NULL,
	`partySize` int NOT NULL,
	`specialRequests` text,
	`status` enum('pending','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'pending',
	`confirmationToken` varchar(100),
	`confirmedAt` timestamp,
	`cancelledAt` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `restaurants` (
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
	`theme` enum('pronto-service','moderne-soho','beach-boheme','day-night','marble-rome') NOT NULL DEFAULT 'pronto-service',
	`subscriptionTier` enum('menu','pro','premium') NOT NULL DEFAULT 'menu',
	`subscriptionStatus` enum('active','trial','expired','cancelled') NOT NULL DEFAULT 'trial',
	`subscriptionExpiresAt` timestamp,
	`showAds` boolean NOT NULL DEFAULT true,
	`featuresEnabled` json DEFAULT ('{"events":true,"reservations":true,"translations":true}'),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurants_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurants_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`plan` enum('basic','premium') NOT NULL,
	`stripePaymentId` varchar(255),
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','restaurateur') NOT NULL DEFAULT 'user';