ALTER TABLE `advertisements` MODIFY COLUMN `imageUrl` text;--> statement-breakpoint
ALTER TABLE `advertisements` MODIFY COLUMN `linkUrl` text;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `description` text;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `format` enum('pastille','footer','fullpage','popup','dish_item') NOT NULL;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `content` json;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `targetPage` enum('landing','restaurant_page','menu','all') DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `recommendedWidth` int;--> statement-breakpoint
ALTER TABLE `advertisements` ADD `recommendedHeight` int;