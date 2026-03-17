ALTER TABLE `trialSignups` ADD `introCountRequired` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `introCountBooked` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `introCountCompleted` int DEFAULT 0 NOT NULL;