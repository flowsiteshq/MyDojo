ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `leadSmsNotify` int DEFAULT 1 NOT NULL;