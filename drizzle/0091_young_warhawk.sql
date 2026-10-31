CREATE TABLE `beltTestScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`criterionKey` varchar(60) NOT NULL,
	`criterionName` varchar(150) NOT NULL,
	`maxPoints` int NOT NULL DEFAULT 10,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`passRequired` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beltTestScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `beltTestSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beltTestIntentId` int NOT NULL,
	`status` varchar(30) NOT NULL DEFAULT 'draft',
	`totalPoints` int NOT NULL DEFAULT 0,
	`earnedPoints` int NOT NULL DEFAULT 0,
	`passThreshold` int NOT NULL DEFAULT 70,
	`passed` int NOT NULL DEFAULT 0,
	`staffNotes` text,
	`highlightPhotoUrl` text,
	`testedAt` timestamp,
	`publishedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `beltTestSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `beltTestSessions_beltTestIntentId_unique` UNIQUE(`beltTestIntentId`)
);
