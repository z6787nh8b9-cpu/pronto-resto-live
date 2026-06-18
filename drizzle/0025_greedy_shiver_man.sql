ALTER TABLE `restaurant_owners` MODIFY COLUMN `provider` enum('google','facebook','email') NOT NULL;--> statement-breakpoint
ALTER TABLE `restaurant_owners` MODIFY COLUMN `providerId` varchar(255);--> statement-breakpoint
ALTER TABLE `restaurant_owners` ADD `passwordHash` varchar(255);