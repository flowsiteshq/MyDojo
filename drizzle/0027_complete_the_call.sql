CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`staffName` varchar(255) NOT NULL,
	`leadId` int NOT NULL,
	`leadName` varchar(255) NOT NULL,
	`program` varchar(100) NOT NULL,
	`bonusAmountCents` int NOT NULL,
	`status` enum('pending','paid','voided') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`paidAt` timestamp,
	`paidByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `assignedStaffId` int;--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `assignedStaffName` varchar(255);--> statement-breakpoint
ALTER TABLE `trialSignups` ADD `assignedAt` timestamp;