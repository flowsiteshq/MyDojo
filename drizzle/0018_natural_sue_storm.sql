CREATE TABLE `membershipChangeRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`requestType` enum('pause','cancel') NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`adminNotes` text,
	`reviewedAt` timestamp,
	`effectiveDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membershipChangeRequests_id` PRIMARY KEY(`id`)
);
