CREATE TABLE `classSchedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adults','Kickboxing') NOT NULL,
	`location` varchar(255) NOT NULL,
	`dayOfWeek` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
	`startTime` varchar(20) NOT NULL,
	`endTime` varchar(20) NOT NULL,
	`instructor` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classSchedule_id` PRIMARY KEY(`id`)
);
