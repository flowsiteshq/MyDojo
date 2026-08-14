ALTER TABLE `summerCampEnrollments` MODIFY COLUMN `fpTransactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `summerCampEnrollments` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `summerCampEnrollments` ADD `stripePaymentIntentId` varchar(255);