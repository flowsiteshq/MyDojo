CREATE TABLE `pnoRsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(64) NOT NULL DEFAULT 'nerf-wars-2025-04-25',
	`parentName` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`studentNames` text NOT NULL,
	`studentCount` int NOT NULL DEFAULT 1,
	`bringingFriend` int NOT NULL DEFAULT 0,
	`friendName` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pnoRsvps_id` PRIMARY KEY(`id`)
);
