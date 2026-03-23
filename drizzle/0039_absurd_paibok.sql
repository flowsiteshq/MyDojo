CREATE TABLE `shiftClasses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shiftId` int NOT NULL,
	`staffUserId` int NOT NULL,
	`program` varchar(255) NOT NULL,
	`classStartAt` bigint NOT NULL,
	`studentCount` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shiftClasses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staffShifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffUserId` int NOT NULL,
	`staffName` varchar(255) NOT NULL,
	`clockInAt` bigint NOT NULL,
	`clockOutAt` bigint,
	`totalMinutes` int,
	`notes` text,
	`location` varchar(255) DEFAULT 'HQ',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffShifts_id` PRIMARY KEY(`id`)
);
