CREATE TABLE `leadMagnetLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255),
	`source` varchar(100) NOT NULL DEFAULT 'popup',
	`guideTitle` varchar(255) NOT NULL DEFAULT '5 Self-Defense Moves Every Parent Should Teach Their Child',
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadMagnetLeads_id` PRIMARY KEY(`id`)
);
