CREATE TABLE `waiverSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(45),
	`waiverVersion` varchar(50) NOT NULL DEFAULT '2026-02',
	`acceptedLiability` int NOT NULL DEFAULT 1,
	`acceptedPhotoConsent` int NOT NULL DEFAULT 1,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `waiverSignatures_id` PRIMARY KEY(`id`)
);
