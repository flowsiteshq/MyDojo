CREATE TABLE `visitorSmsSent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(30) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'direct',
	`name` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorSmsSent_id` PRIMARY KEY(`id`)
);
