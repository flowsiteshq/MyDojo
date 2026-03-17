CREATE TABLE `adminConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminConfig_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `deletionAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('lead','student') NOT NULL,
	`targetId` int NOT NULL,
	`targetName` varchar(255) NOT NULL,
	`performedBy` int NOT NULL,
	`performedByName` varchar(255) NOT NULL,
	`performedByEmail` varchar(320) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletionAuditLog_id` PRIMARY KEY(`id`)
);
