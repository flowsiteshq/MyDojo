ALTER TABLE `beltTestIntents` ADD `paypalOrderId` varchar(64);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `paypalCaptureId` varchar(64);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `emergencyContactName` varchar(255);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `emergencyContactPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `waiverAccepted` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `paymentStatus` varchar(30) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `amountCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `paypalOrderId` varchar(64);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `paypalCaptureId` varchar(64);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD CONSTRAINT `beltTestIntents_paypalOrderId_unique` UNIQUE(`paypalOrderId`);--> statement-breakpoint
ALTER TABLE `pnoRsvps` ADD CONSTRAINT `pnoRsvps_paypalOrderId_unique` UNIQUE(`paypalOrderId`);