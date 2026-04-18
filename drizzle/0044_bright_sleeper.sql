ALTER TABLE `enrollments` ADD `deferredTuitionDate` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `deferredTuitionAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `deferredTuitionCharged` int DEFAULT 0 NOT NULL;