ALTER TABLE `trialSignups` ADD `trialStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `membershipActivationDate` timestamp;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `membershipActivated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `trialStripeSubscriptionId` varchar(255);