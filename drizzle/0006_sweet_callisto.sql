CREATE TABLE `staffInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`token` varchar(128) NOT NULL,
	`inviteRole` enum('staff','admin') NOT NULL DEFAULT 'staff',
	`invitedBy` int NOT NULL,
	`accepted` int NOT NULL DEFAULT 0,
	`acceptedAt` timestamp,
	`acceptedByUserId` int,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staffInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `staffInvites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','staff') NOT NULL DEFAULT 'user';