ALTER TABLE `beltTestIntents` MODIFY COLUMN `eventId` varchar(64) NOT NULL DEFAULT 'oct-2026-belt-promotion';--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `nextBelt` varchar(100);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `currentProgram` varchar(255);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `instructorRecommendationStatus` varchar(30) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `paymentAmountCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `parentAcknowledgment` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `signatureName` varchar(255);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `signedAt` timestamp;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `upgradeStatus` varchar(30) DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `upgradeTargetPlan` varchar(100);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `upgradeRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `equipmentChoice` varchar(40) DEFAULT 'later' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `equipmentSize` varchar(50);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `equipmentPaymentStatus` varchar(30) DEFAULT 'not_selected' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `ceremonyStatus` varchar(30) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `instructorApproved` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `uniformSize` varchar(50);