ALTER TABLE `beltTestIntents` ADD `groupId` varchar(64);--> statement-breakpoint
ALTER TABLE `beltTestIntents` ADD `childIndex` int DEFAULT 0 NOT NULL;