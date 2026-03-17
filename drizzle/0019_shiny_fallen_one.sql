CREATE TABLE `curriculumContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beltRank` enum('No Belt','White Belt','Yellow Belt','Orange Belt','Green Belt','Advanced Green','Blue Belt','Advanced Blue','Purple Belt','Advanced Purple','Brown Belt','Advanced Brown','Probationary Black','Black Belt 1st Dan') NOT NULL,
	`category` enum('Equipment','Striking Techniques','Defensive Techniques','Grappling','Combos','Self-Defense','Sets','Knowledge','Forms') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`videoUrl` text,
	`imageUrl` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curriculumContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`curriculumContentId` int NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedAt` timestamp,
	`instructorNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `enrollments` ADD `beltRank` enum('No Belt','White Belt','Yellow Belt','Orange Belt','Green Belt','Advanced Green','Blue Belt','Advanced Blue','Purple Belt','Advanced Purple','Brown Belt','Advanced Brown','Probationary Black','Black Belt 1st Dan','Black Belt 2nd Dan','Black Belt 3rd Dan','Black Belt 4th Dan','Black Belt 5th Dan','Black Belt 6th Dan') DEFAULT 'No Belt' NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `beltAchievedDate` timestamp;