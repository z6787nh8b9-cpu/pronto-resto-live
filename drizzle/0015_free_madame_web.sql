CREATE TABLE `restaurant_owners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text NOT NULL,
	`avatarUrl` text,
	`provider` enum('google','facebook') NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `restaurant_owners_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurant_owners_email_unique` UNIQUE(`email`)
);
