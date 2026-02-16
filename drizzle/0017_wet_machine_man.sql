CREATE TABLE `chatbot_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('call_request','issue_report') NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`message` text NOT NULL,
	`status` enum('pending','contacted','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_requests_id` PRIMARY KEY(`id`)
);
