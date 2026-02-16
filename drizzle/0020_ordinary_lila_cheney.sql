CREATE TABLE `admin_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_invitations_token_unique` UNIQUE(`token`)
);
