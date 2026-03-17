CREATE TABLE `trialSignups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`program` enum('Little Ninjas','Core Kids','Teens','Adults','Kickboxing','After School','Not Sure') NOT NULL,
	`location` varchar(255) NOT NULL,
	`preferredContactMethod` enum('email','phone','text') NOT NULL DEFAULT 'email',
	`message` text,
	`status` enum('new','contacted','scheduled','completed','cancelled') NOT NULL DEFAULT 'new',
	`source` varchar(100) NOT NULL DEFAULT 'chatbot',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trialSignups_id` PRIMARY KEY(`id`)
);
