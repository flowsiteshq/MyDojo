ALTER TABLE `enrollments` ADD `classesAtCurrentBelt` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `currentStripePhase` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `stripesInCurrentPhase` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `beltExamEligible` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `beltExamFeePaid` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `beltExamPaymentId` varchar(255);