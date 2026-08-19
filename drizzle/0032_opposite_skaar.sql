CREATE TABLE `local_admin_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedByAdminId` int,
	`createdByAdminId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `local_admin_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_admin_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `local_admin_invitations_email_idx` ON `local_admin_invitations` (`email`,`status`);--> statement-breakpoint
CREATE INDEX `local_admin_invitations_expiry_idx` ON `local_admin_invitations` (`expiresAt`);