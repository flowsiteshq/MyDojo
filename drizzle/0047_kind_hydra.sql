CREATE TABLE `summerCampEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentName` varchar(255) NOT NULL,
	`parentEmail` varchar(320) NOT NULL,
	`parentPhone` varchar(30) NOT NULL,
	`students` text NOT NULL,
	`weeks` text NOT NULL,
	`weekCount` int NOT NULL,
	`studentCount` int NOT NULL,
	`isFullSummer` int NOT NULL DEFAULT 0,
	`amountCents` int NOT NULL,
	`fpTransactionId` varchar(255) NOT NULL,
	`status` enum('approved','declined','error') NOT NULL DEFAULT 'approved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `summerCampEnrollments_id` PRIMARY KEY(`id`)
);
