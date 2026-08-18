CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`principalType` enum('admin','owner','system') NOT NULL,
	`principalId` int,
	`eventType` varchar(100) NOT NULL,
	`outcome` enum('success','failure','info') NOT NULL,
	`ipHash` varchar(64),
	`route` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `security_events_principal_idx` ON `security_events` (`principalType`,`principalId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `security_events_event_idx` ON `security_events` (`eventType`,`createdAt`);