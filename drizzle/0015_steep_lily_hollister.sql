ALTER TABLE `trialSignups` ADD `lastContactedAt` timestamp;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `lastContactMethod` enum('call','text','email');