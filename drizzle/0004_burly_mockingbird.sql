CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberName` varchar(255) NOT NULL,
	`memberPhoto` text,
	`program` enum('Little Ninjas','Core Kids','Teens','Adults','Kickboxing','After School') NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`memberSince` varchar(100),
	`featured` int NOT NULL DEFAULT 0,
	`isApproved` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
