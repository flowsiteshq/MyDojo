ALTER TABLE `manualEnrollments` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `manualEnrollments` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `manualEnrollments` ADD `stripePaymentIntentId` varchar(64);--> statement-breakpoint
ALTER TABLE `manualEnrollments` ADD `stripePaymentMethodId` varchar(64);--> statement-breakpoint
ALTER TABLE `manualEnrollments` ADD `processor` varchar(16) DEFAULT 'fluidpay';