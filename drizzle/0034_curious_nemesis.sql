CREATE TABLE `studentAppointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`studentPhone` varchar(20) NOT NULL,
	`program` varchar(100) NOT NULL,
	`scheduledTime` timestamp NOT NULL,
	`location` varchar(255) NOT NULL DEFAULT 'HQ - Tomball',
	`instructor` varchar(255),
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`reminderSentAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentAppointments_id` PRIMARY KEY(`id`)
);
