ALTER TABLE `enrollments` ADD `dateOfBirth` varchar(10);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `totalXP` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `longestStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `lastCheckInDate` varchar(10);--> statement-breakpoint
ALTER TABLE `enrollments` ADD `photoUrl` text;