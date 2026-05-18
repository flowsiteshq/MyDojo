CREATE TABLE `buddyDayRsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(320),
	`attendeeCount` int NOT NULL DEFAULT 1,
	`attendeeDetails` text,
	`memberType` enum('member','guest') NOT NULL DEFAULT 'guest',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buddyDayRsvps_id` PRIMARY KEY(`id`)
);
