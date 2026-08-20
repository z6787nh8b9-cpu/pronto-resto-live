ALTER TABLE `admin_accounts` ADD COLUMN IF NOT EXISTS `authVersion` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurant_owners` ADD COLUMN IF NOT EXISTS `authVersion` int DEFAULT 1 NOT NULL;
