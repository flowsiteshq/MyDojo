CREATE TABLE `dayPasses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(30),
	`program` varchar(100) NOT NULL,
	`amountCents` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`attendanceId` int,
	`classId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dayPasses_id` PRIMARY KEY(`id`)
);
