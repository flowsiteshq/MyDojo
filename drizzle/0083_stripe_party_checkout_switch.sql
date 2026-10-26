ALTER TABLE `partyBookings` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `partyBookings` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `partyBookings` ADD CONSTRAINT `partyBookings_stripeCheckoutSessionId_unique` UNIQUE(`stripeCheckoutSessionId`);--> statement-breakpoint
ALTER TABLE `partyBookings` ADD CONSTRAINT `partyBookings_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`);