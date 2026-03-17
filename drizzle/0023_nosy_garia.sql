CREATE TABLE `popupLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign` varchar(50) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`phone` varchar(30),
	`source` varchar(100) NOT NULL DEFAULT 'popup',
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `popupLeads_id` PRIMARY KEY(`id`)
);
