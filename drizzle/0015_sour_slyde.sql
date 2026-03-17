CREATE TABLE `staffCallbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(20) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`reason` varchar(500) NOT NULL,
	`program` varchar(100),
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`staffNotes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staffCallbacks_id` PRIMARY KEY(`id`)
);
