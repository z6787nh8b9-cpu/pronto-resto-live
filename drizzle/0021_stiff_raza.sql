CREATE TABLE `admin_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` text NOT NULL,
	`avatarUrl` text,
	`googleId` varchar(255) NOT NULL,
	`invitationId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_accounts_email_unique` UNIQUE(`email`),
	CONSTRAINT `admin_accounts_googleId_unique` UNIQUE(`googleId`)
);
--> statement-breakpoint
ALTER TABLE `admin_invitations` ADD `usedBy` int;--> statement-breakpoint
ALTER TABLE `admin_invitations` DROP COLUMN `email`;