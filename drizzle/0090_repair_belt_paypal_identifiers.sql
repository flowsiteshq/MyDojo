ALTER TABLE `beltTestIntents` ADD `paypalOrderId` varchar(64) NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `paypalCaptureId` varchar(64) NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD CONSTRAINT `beltTestIntents_paypalOrderId_unique` UNIQUE(`paypalOrderId`);