CREATE TABLE `import_job_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importJobId` int NOT NULL,
	`rowNumber` int NOT NULL,
	`rawData` json,
	`normalizedData` json,
	`confidence` decimal(5,4),
	`status` enum('accepted','needs_review','rejected') NOT NULL DEFAULT 'needs_review',
	`validationErrors` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_job_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_job_rows_job_row_unique` UNIQUE(`importJobId`,`rowNumber`)
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`targetCatalogId` int,
	`sourceType` enum('csv','pdf','image') NOT NULL,
	`sourceFileName` varchar(255) NOT NULL,
	`sourceMimeType` varchar(120) NOT NULL,
	`sourceUrl` text NOT NULL,
	`status` enum('uploaded','analyzing','review_required','applying','applied','failed') NOT NULL DEFAULT 'uploaded',
	`draft` json,
	`validationErrors` json,
	`createdByPrincipalType` enum('restaurant_owner','admin_account','manus_user') NOT NULL,
	`createdByPrincipalId` int NOT NULL,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `import_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `business_profiles` MODIFY COLUMN `socialLinks` json;--> statement-breakpoint
ALTER TABLE `catalog_items` MODIFY COLUMN `attributes` json;--> statement-breakpoint
CREATE INDEX `import_job_rows_job_status_idx` ON `import_job_rows` (`importJobId`,`status`);--> statement-breakpoint
CREATE INDEX `import_jobs_business_status_idx` ON `import_jobs` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `import_jobs_target_catalog_idx` ON `import_jobs` (`targetCatalogId`);