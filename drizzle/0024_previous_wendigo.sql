CREATE TABLE `childProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dateOfBirth` varchar(10),
	`program` enum('Little Ninjas','Dragon Kids','Teens','Adult Karate','Kickboxing','After School','Summer Camp','Not Sure') NOT NULL DEFAULT 'Not Sure',
	`photoUrl` varchar(1000),
	`photoKey` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `childProfiles_id` PRIMARY KEY(`id`)
);
