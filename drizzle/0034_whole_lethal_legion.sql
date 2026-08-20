ALTER TABLE `invitations` ADD `tokenHash` varchar(64);--> statement-breakpoint
UPDATE `invitations` SET `tokenHash` = SHA2(`token`, 256) WHERE `tokenHash` IS NULL;--> statement-breakpoint
ALTER TABLE `invitations` MODIFY `tokenHash` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_tokenHash_unique` UNIQUE(`tokenHash`);--> statement-breakpoint
ALTER TABLE `invitations` DROP INDEX `invitations_token_unique`;--> statement-breakpoint
ALTER TABLE `invitations` DROP COLUMN `token`;
