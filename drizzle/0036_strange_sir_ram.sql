CREATE TABLE `calendarTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`taskDate` timestamp NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`assignedToUserId` int,
	`assignedToName` varchar(255),
	`category` enum('class','meeting','cleaning','event','training','other') NOT NULL DEFAULT 'other',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdByUserId` int NOT NULL,
	`createdByName` varchar(255),
	`staffNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeOffRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userEmail` varchar(320) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`reason` text,
	`type` enum('vacation','sick','personal','emergency','other') NOT NULL DEFAULT 'personal',
	`status` enum('pending','approved','denied') NOT NULL DEFAULT 'pending',
	`reviewedByUserId` int,
	`reviewedByName` varchar(255),
	`adminNotes` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeOffRequests_id` PRIMARY KEY(`id`)
);
