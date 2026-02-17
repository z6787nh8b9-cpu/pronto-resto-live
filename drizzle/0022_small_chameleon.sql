ALTER TABLE `admin_accounts` DROP INDEX `admin_accounts_googleId_unique`;--> statement-breakpoint
ALTER TABLE `admin_accounts` ADD `passwordHash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_accounts` ADD `invitationToken` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_accounts` DROP COLUMN `googleId`;--> statement-breakpoint
ALTER TABLE `admin_accounts` DROP COLUMN `invitationId`;