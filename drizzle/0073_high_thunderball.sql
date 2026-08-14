ALTER TABLE `customPaymentLinkPayments` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `customPaymentLinkPayments` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `customPaymentLinkPayments` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `dayPasses` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `dayPasses` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `introOfferPurchases` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `introOfferPurchases` ADD `stripePaymentIntentId` varchar(255);