ALTER TABLE `enrollments` ADD `cancellationRequestedAt` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `cancellationEffectiveDate` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `cancellationReason` varchar(500);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `finalBillingProcessed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `freezeStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `freezeEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `freezeReason` varchar(500);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `isFrozen` int DEFAULT 0 NOT NULL;