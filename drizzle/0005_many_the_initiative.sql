ALTER TABLE `trialSignups` ADD `dojoFlowSyncStatus` enum('pending','synced','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `dojoFlowSyncAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `dojoFlowLastSyncAttempt` timestamp;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `dojoFlowSyncError` text;