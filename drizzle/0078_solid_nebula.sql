ALTER TABLE `scheduledPayments` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduledPayments` ADD `stripePaymentMethodId` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduledPayments` ADD `stripeSetupIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduledPayments` ADD `stripePaymentIntentId` varchar(255);