ALTER TABLE `partyBookings` ADD `paypalHostedLinkId` varchar(64);--> statement-breakpoint
ALTER TABLE `partyBookings` ADD `paymentConfirmationMethod` enum('paypal_webhook','paypal_manual');--> statement-breakpoint
ALTER TABLE `partyBookings` ADD `paymentConfirmedBy` int;--> statement-breakpoint
ALTER TABLE `partyBookings` ADD `paymentConfirmationReference` varchar(128);