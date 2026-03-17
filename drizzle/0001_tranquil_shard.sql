CREATE TABLE `classAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`classScheduleId` int NOT NULL,
	`attendanceDate` varchar(10) NOT NULL,
	`checkInTime` timestamp NOT NULL,
	`checkInMethod` enum('manual','qr_code','admin') NOT NULL DEFAULT 'manual',
	`checkOutTime` timestamp,
	`status` enum('present','late','absent','excused') NOT NULL DEFAULT 'present',
	`notes` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classAttendance_id` PRIMARY KEY(`id`)
);
