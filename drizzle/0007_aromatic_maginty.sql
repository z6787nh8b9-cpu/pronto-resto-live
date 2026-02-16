CREATE TABLE `opening_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`restaurantId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`openTime` varchar(5),
	`closeTime` varchar(5),
	`isClosed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opening_hours_id` PRIMARY KEY(`id`)
);
