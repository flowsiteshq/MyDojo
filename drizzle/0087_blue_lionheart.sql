ALTER TABLE `beltTestIntents` ADD `currentStripeColor` varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `currentStripeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `stripeProgressVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `promotionEligibility` varchar(40) DEFAULT 'incomplete' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `eligibilityException` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `eligibilityExceptionNote` text;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `eligibilityExceptionApprovedBy` int;