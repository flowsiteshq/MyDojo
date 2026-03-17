CREATE TABLE `beltPromotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`studentName` varchar(255) NOT NULL,
	`fromBelt` varchar(100) NOT NULL,
	`toBelt` varchar(100) NOT NULL,
	`classesAtPromotion` int NOT NULL,
	`promotedBy` int NOT NULL,
	`promotedByName` varchar(255) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `beltPromotions_id` PRIMARY KEY(`id`)
);
