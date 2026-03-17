CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`enrollmentId` int,
	`classId` int,
	`locationId` varchar(255) NOT NULL DEFAULT 'Tomball HQ',
	`checkInTimestamp` timestamp NOT NULL DEFAULT (now()),
	`checkInDate` varchar(10) NOT NULL,
	`beltRankAtCheckIn` varchar(50),
	`xpAwarded` int NOT NULL DEFAULT 0,
	`source` enum('kiosk','staff','admin','mobile') NOT NULL DEFAULT 'kiosk',
	`programType` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
