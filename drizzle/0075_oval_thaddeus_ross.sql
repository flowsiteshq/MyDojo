ALTER TABLE `paymentFailures` ADD `stripeInvoiceId` varchar(255);--> statement-breakpoint
ALTER TABLE `paymentFailures` ADD `stripeSubscriptionId` varchar(255);