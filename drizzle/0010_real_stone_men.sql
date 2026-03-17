ALTER TABLE `trialSignups` ADD `bookingRequestId` varchar(36);--> statement-breakpoint
ALTER TABLE `trialSignups` ADD CONSTRAINT `trialSignups_bookingRequestId_unique` UNIQUE(`bookingRequestId`);