DROP TABLE `advertisements`;--> statement-breakpoint
DROP TABLE `chatbotConfigs`;--> statement-breakpoint
DROP TABLE `chatbotConversations`;--> statement-breakpoint
DROP TABLE `event_registrations`;--> statement-breakpoint
DROP TABLE `events`;--> statement-breakpoint
DROP TABLE `gallery_photos`;--> statement-breakpoint
DROP TABLE `menuCategories`;--> statement-breakpoint
DROP TABLE `menuItems`;--> statement-breakpoint
DROP TABLE `opening_hours`;--> statement-breakpoint
DROP TABLE `pageViews`;--> statement-breakpoint
DROP TABLE `reservation_settings`;--> statement-breakpoint
DROP TABLE `reservation_zones`;--> statement-breakpoint
DROP TABLE `reservations`;--> statement-breakpoint
DROP TABLE `restaurants`;--> statement-breakpoint
DROP TABLE `subscriptionTransactions`;--> statement-breakpoint
DROP TABLE `translations`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';