CREATE TABLE `staffAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`staffName` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`classScheduleId` int,
	`status` enum('unavailable','needs_cover','covered') NOT NULL DEFAULT 'needs_cover',
	`reason` varchar(500),
	`coverStaffUserId` int,
	`coverStaffName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staffScheduleAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classScheduleId` int NOT NULL,
	`staffUserId` int NOT NULL,
	`staffName` varchar(255) NOT NULL,
	`role` enum('primary','backup') NOT NULL DEFAULT 'primary',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffScheduleAssignments_id` PRIMARY KEY(`id`)
);
