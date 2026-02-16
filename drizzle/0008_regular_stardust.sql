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
