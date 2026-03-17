CREATE TABLE `streakMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`milestone` int NOT NULL,
	`emailSentTo` varchar(320),
	`emailSent` int NOT NULL DEFAULT 0,
	`streakAtMilestone` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streakMilestones_id` PRIMARY KEY(`id`)
);
