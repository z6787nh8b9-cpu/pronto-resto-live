CREATE TABLE `business_member_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('administrator','editor','publisher','analyst','support') NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`status` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
	`invitedByPrincipalId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedByPrincipalId` int,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_member_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_member_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `business_member_invites_business_status_idx` ON `business_member_invitations` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `business_member_invites_email_status_idx` ON `business_member_invitations` (`email`,`status`);